import { WebSocket } from 'ws';
import { User } from '../User';
import {
  Session,
  SessionsManager,
  ErrorSession
} from '../session';
import {
  Command,
  Message,
  ErrorCode,
  SessionDeleteReason,
  type IHelloRequest,
  type ICurrentSongVerse,
  type ISessionJoin,
  type ISpreadSongVerse
} from "@abybylijedno/songbook-protocol";


import { getSubLogger } from "../../commons/logger";
const logger = getSubLogger("Connection");


/**
 * Connection
 */
export class Connection {

  private socket: WebSocket;
  public user: User;

  get session(): Session | undefined {
    try {
      return SessionsManager.findUserSession(this.user);
    } catch (e) {
      return undefined;
    }
  }

  constructor(socket: WebSocket) {
    this.socket = socket;
    this.user = new User();
  }

  /**
   * Close connection
   */
  close() {
    this.socket.end();
  }

  /**
   * Notify about session deletion 
   */
  notifyAboutSessionDeletion(deleteReason: SessionDeleteReason) {
    this.sendSessionDeleted(deleteReason);
  }

  /**
   * Send message
   * 
   * @param message 
   */
  private sendMessage(message: Message) {
    this.socket.send(message.encode(), true);
  }

  /**
   * Send Error message
   * 
   * @param code Error code
   */
  private sendError(code: ErrorCode) {
    this.sendMessage(Message.fromErrorMessage({
      code
    }));
  }

  /**
   * Send HelloResponse
   */
  private sendHelloResponse() {
    if (!this.user.uid) {
      logger.warn(`User ${this.user.name} has no UID - closing connection`);
      this.close();
      return;
    }
    
    this.sendMessage(Message.fromHelloResponse({
      uid: this.user.uid
    }));
  }

  /**
   * Send SessionDetails
   */
  public sendSessionDetails() {
    const session = this.session;

    if (!session) {
      logger.debug(`User ${this.user.name} tried to get session info, but has no session`);
      this.sendError(ErrorCode.SessionYouHaveNone);
      return;
    }

    this.sendMessage(Message.fromSessionDetails(session.toObjectForUser(this.user)));
  }

  /**
   * Send SessionDeleted
   * 
   * @param reason Delete reason 
   */
  private sendSessionDeleted(reason: SessionDeleteReason) {
    this.sendMessage(Message.fromSessionDeleted({
      reason
    }));
  }

  /**
   * Send current SongVerse
   * @param sv SongVerse 
   */
  private sendCurrentSongVerse(sv: ICurrentSongVerse) {
    this.sendMessage(Message.fromCurrentSongVerse(sv));
  }

  /**
   * Handle Pong
   */
  handlePong() {
    const session = this.session;
    if (session && session.creator?.uid === this.user.uid) {
      logger.debug(`User ${this.user.name} is the creator of session ${session.id} - refreshing expiration date`);
      session.refreshExpirationDate();
    }
  }

  /**
   * Handle incoming message
   * This function is called when a client sends a message.
   * It decodes the message and calls the appropriate function.
   * 
   * @param ws 
   * @param message 
   */
  handleCommand(message: ArrayBuffer) {
    const buffer = Buffer.from(message);
    const command = Command.decode(buffer);

    if (command.isHelloRequest()) {
      this.handleHelloRequest(command.data.value as IHelloRequest);

    } else if (command.isSessionCreate()) {
      this.handleSessionCreate();

    } else if (command.isSessionDelete()) {
      this.handleSessionDelete();

    } else if (command.isSessionJoin()) {
      this.handleSessionJoin(command.data.value as ISessionJoin);

    } else if (command.isSessionLeave()) {
      this.handleSessionLeave();

    } else if (command.isSessionGet()) {
      this.handleSessionGet();

    } else if (command.isSpreadSongVerse()) {
      this.handleSpreadSongVerse(command.data.value as ISpreadSongVerse);

    } else {
      this.sendError(ErrorCode.InvalidCommand);
    }
  }

  /**
   * Handle Hello
   * This function handles the HelloRequest command.
   * User must provide a name, but it's not mandatory to provide a UID.
   * If the UID is not provided, the server will generate one.
   * If the UID is provided, the server will use it.
   * After that the server will send back also Hello, which fullfills the handshake.
   * 
   * @param user 
   * @returns 
   */
  private handleHelloRequest(req: IHelloRequest) {
    if (!req.name) {
      logger.warn(`Hello command received without user name - closing connection`);
      this.close();
      return;
    }

    this.user.setName(req.name);

    if (req.uid == null) {
      logger.debug(`Hello command received from user ${req.name}`);
      this.user.setRandomUid();

    } else {
      logger.debug(`Hello command received from user ${req.name} with UID ${req.uid}`);
      this.user.setUid(req.uid);
    }
    
    logger.debug(`Sending back Hello to user ${req.name}`);
    this.sendHelloResponse();

    const session = this.session;
    if (session) {
      logger.debug(`User ${this.user.name} is a member of session ${session.id} - sending session details`);
      this.sendSessionDetails();
    }
  }


  /**
   * Handle SessionCreate
   */
  private handleSessionCreate() {
    logger.debug(`User ${this.user.name} requested to create session`);

    if (this.session) {
      logger.debug(`User ${this.user.name} tried to create session, but has one already`);
      this.sendError(ErrorCode.SessionYouHaveOne);
      return;
    }

    SessionsManager.createSession(this.user);
    this.sendSessionDetails();
  }

  /**
   * Handle SessionDelete
   * @param session 
   */
  private handleSessionDelete() {
    logger.debug(`User ${this.user.name} requested to delete session`);
    const session = this.session;

    if (!session) {
      logger.debug(`User ${this.user.name} tried to delete session, but has none`);
      this.sendError(ErrorCode.SessionYouHaveNone);
      return;

    } else if (session.creator?.uid !== this.user.uid) {
      logger.debug(`User ${this.user.name} tried to delete session, but is not the creator`);
      this.sendError(ErrorCode.SessionYouAreNotCreator);
      return;

    }

    try {
      SessionsManager.deleteSessionWithId(session.id);
      logger.debug(`Session ${session.id} has been deleted`);
      this.sendSessionDeleted(SessionDeleteReason.CreatorsDecision);
      
    } catch (e) {
      logger.error(`Error while deleting session ${session.id} for user ${this.user.name}: ${e}`);
      this.sendError(ErrorCode.Unknown);
    }
  }

  /**
   * Handle SessionJoin
   */
  private handleSessionJoin(req: ISessionJoin) {
    const sessionId = req.id.trim();

    if (sessionId.length === 0) {
      logger.debug(`User ${this.user.name} tried to join the session, but no ID provided`);
      this.sendError(ErrorCode.SessionIdRequired);
      return;

    } else if (this.session) {
      logger.debug(`User ${this.user.name} tried to join the session, but has one already`);
      this.sendError(ErrorCode.SessionYouHaveOne);
      return;
    }

    const session = SessionsManager.getSessionById(sessionId);
    if (!session) {
      logger.debug(`User ${this.user.name} tried to join the session, but it does not exist`);
      this.sendError(ErrorCode.SessionNotFound);
      return;
    }
    
    session.addUser(this.user);
    logger.debug(`User ${this.user.name} joined session ${session.id}`);
    
    session.sendDetailsToEveryMember();
  }

  /**
   * Handle SessionLeave
   */
  private handleSessionLeave() {
    const session = this.session;

    if (!session) {
      logger.debug(`User ${this.user.name} tried to leave a session, but has none`);
      this.sendError(ErrorCode.SessionYouHaveNone);
      return;

    } else if (session.creator?.uid === this.user.uid) {
      logger.debug(`User ${this.user.name} tried to leave a session, but is the creator`);
      this.sendError(ErrorCode.SessionCannotLeaveAsCreator);
      return;
    }

    try {
      session.removeUser(this.user);
      logger.debug(`User ${this.user.name} left session ${session.id}`);
      
      this.sendSessionDeleted(SessionDeleteReason.UserLeft);
      session.sendDetailsToEveryMember();
      
    } catch (e) {
      logger.error(`Error while leaving session ${session?.id} for user ${this.user.name}: ${e}`);
      
      if (e instanceof ErrorSession) {
        this.sendError(e.code);
      }
    }
  }

  /**
   * Handle SessionGet
   */
  private handleSessionGet() {
    logger.debug(`User ${this.user.name} requested session info`);
    this.sendSessionDetails();
  }

  /**
   * Handle SpreadSongVerse
   */
  private handleSpreadSongVerse(req: ISpreadSongVerse) {
    const session = this.session;

    if (!session) {
      logger.debug(`User ${this.user.name} tried to spread song verse, but has no session`);
      this.sendError(ErrorCode.SessionYouHaveNone);
      return;

    } else if (session.creator?.uid !== this.user.uid) {
      logger.debug(`User ${this.user.name} tried to spread song verse, but is not the creator`);
      this.sendError(ErrorCode.SessionYouAreNotCreator);
      return;
    }

    for(const member of session.members) {
      if (member.user.uid !== this.user.uid) {
        member.connection?.sendCurrentSongVerse(req);
      }
    }
  }


}
