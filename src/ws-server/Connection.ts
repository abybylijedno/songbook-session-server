import { WebSocket } from 'uWebSockets.js';
import { User } from './User';
import { Session } from './Session';
import {
  Command,
  Message,
  type IErrorMessage,
  type IHelloRequest,
  type ICurrentSongVerse,
  type ISessionJoin,
  type ISpreadSongVerse
} from "@abybylijedno/songbook-protocol";
import { SessionsManager } from './SessionsManager';


import { getSubLogger } from "../commons/logger";
import { Errors } from './errors';

const logger = getSubLogger("commander");


export class Connection {

  private socket: WebSocket<unknown>;
  public user: User;

  get session(): Session | undefined {
    try {
      return SessionsManager.findUserSession(this.user);
    } catch (e) {
      return undefined;
    }
  }

  constructor(socket: WebSocket<unknown>) {
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
   * Send message
   * 
   * @param message 
   */
  private sendMessage(message: Message) {
    this.socket.send(message.encode(), true);
  }

  /**
   * Send Info message
   * 
   * @param text Info message
   */
  private sendInfo(text: string) {
    this.sendMessage(Message.fromInfoMessage({
      text
    }));
  }

   /**
  * Send OK
  */
  private sendOK() {
    this.sendInfo('OK');
  }

  /**
   * Send Error message
   * 
   * @param code Error code
   * @param text Error message
   */
  private sendError(error: IErrorMessage) {
    this.sendMessage(Message.fromErrorMessage(error));
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
  private sendSessionDetails() {
    const session = this.session;

    if (!session) {
      logger.debug(`User ${this.user.name} tried to get session info, but has no session`);
      this.sendError(Errors.YOU_HAVE_NO_SESSION);
      return;
    }

    this.sendMessage(Message.fromSessionDetails(session.toObjectForUser(this.user)));
  }

  /**
   * Send current SongVerse
   * @param sv SongVerse 
   */
  private sendCurrentSongVerse(sv: ICurrentSongVerse) {
    this.sendMessage(Message.fromCurrentSongVerse(sv));
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
      this.sendError(Errors.UNKNOWN_COMMAND);
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

    try {
      SessionsManager.createSession(this.user);
      this.sendSessionDetails();
      
    } catch (e) {
      logger.error(`Error while creating session for user ${this.user.name}: ${e}`);
      this.sendError(e as IErrorMessage);
    }
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
      this.sendError(Errors.YOU_HAVE_NO_SESSION);
      return;
    } else if (session.creator?.uid !== this.user.uid) {
      logger.debug(`User ${this.user.name} tried to delete session, but is not the creator`);
      this.sendError(Errors.YOU_ARE_NOT_CREATOR);
      return;
    }

    try {
      SessionsManager.deleteSessionWithId(session.id);
      logger.debug(`Session ${session.id} has been deleted`);
      this.sendOK();
      
    } catch (e) {
      logger.error(`Error while deleting session ${session.id} for user ${this.user.name}: ${e}`);
      this.sendError(Errors.UNKNOWN_ERROR);
    }
  }

  /**
   * Handle SessionJoin
   */
  private handleSessionJoin(req: ISessionJoin) {
    const sessionId = req.id.trim();

    if (sessionId.length === 0) {
      logger.debug(`User ${this.user.name} tried to join the session, but no ID provided`);
      this.sendError(Errors.SESSION_ID_IS_NOT_PROVIDED);
      return;

    } else if (this.session) {
      logger.debug(`User ${this.user.name} tried to join the session, but has one already`);
      this.sendError(Errors.YOU_ARE_MEMBER_OF_SESSION);
      return;
    }

    const session = SessionsManager.getSessionById(sessionId);
    if (!session) {
      logger.debug(`User ${this.user.name} tried to join the session, but it does not exist`);
      this.sendError(Errors.SESSION_WITH_GIVEN_ID_DOES_NOT_EXIST);
      return;
    }
    
    session.addUser(this.user);
    logger.debug(`User ${this.user.name} joined session ${session.id}`);
    
    this.sendSessionDetails();
  }

  /**
   * Handle SessionLeave
   */
  private handleSessionLeave() {
    const session = this.session;

    if (!session) {
      logger.debug(`User ${this.user.name} tried to leave a session, but has none`);
      this.sendError(Errors.YOU_HAVE_NO_SESSION);
      return;

    } else if (session.creator?.uid === this.user.uid) {
      logger.debug(`User ${this.user.name} tried to leave a session, but is the creator`);
      this.sendError(Errors.CANNOT_LEAVE_SESSION_AS_CREATOR);
      return;
    }

    try {
      this.session.removeUser(this.user);
      logger.debug(`User ${this.user.name} left session ${this.session.id}`);
      this.sendOK();
      
    } catch (e) {
      logger.error(`Error while leaving session ${this.session?.id} for user ${this.user.name}: ${e}`);
      this.sendError(e as IErrorMessage);
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
      this.sendError(Errors.YOU_HAVE_NO_SESSION);
      return;

    } else if (session.creator?.uid !== this.user.uid) {
      logger.debug(`User ${this.user.name} tried to spread song verse, but is not the creator`);
      this.sendError(Errors.YOU_ARE_NOT_CREATOR);
      return;
    }

    for(const member of session.members) {
      if (member.user.uid !== this.user.uid) {
        member.connection?.sendCurrentSongVerse(req);
      }
    }

    // this.sendOK();
  }


}
