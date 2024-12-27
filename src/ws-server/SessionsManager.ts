import { Session } from './Session';
import { type IUser } from '@abybylijedno/songbook-protocol';
import { getSubLogger } from "../commons/logger";
import { Errors } from './errors';

const logger = getSubLogger("SessionsManager");


export const SessionsManager = {

  sessions: [] as Session[],

  /**
   * Create a new session
   * 
   * @param session 
   * @returns 
   */
  createSession(user: IUser): Session {
    {
      const session = SessionsManager.findUserSession(user);
      if (session) {
        logger.debug(`User ${user.name} has already a session ${session.id}`);
        if (session.creator?.uid === user.uid) {
          throw Errors.YOU_HAVE_SESSION_ALREADY;
        } else {
          throw Errors.YOU_ARE_MEMBER_OF_SESSION;
        }
      }
    }

    const session = new Session(user);
    logger.debug(`Session ${session.id} has been created for user ${user.name}`);
    SessionsManager.sessions.push(session);
    return session;
  },

  /**
   * Delete a session with given ID
   * 
   * @param id 
   */
  deleteSessionWithId(id: string): Session | undefined {
    for (let i = 0; i < SessionsManager.sessions.length; i++) {
      if (SessionsManager.sessions[i]?.id === id) {
        logger.debug(`Session ${id} has been deleted`);
        return SessionsManager.sessions.splice(i, 1)[0];
      }
    }
    return undefined;
  },

  /**
   * Get the session by ID
   * 
   * @param id 
   * @returns 
   */
  getSessionById(id: string): Session | undefined {
    for (const session of SessionsManager.sessions) {
      if (session.id === id) {
        return session;
      }
    }

    return undefined;
  },

  /**
   * Get the session by creator
   * 
   * @param creator 
   * @returns 
   */
  getSessionByCreator(creator: IUser): Session | undefined {
    for (const session of SessionsManager.sessions) {
      if (session.creator?.uid === creator.uid) {
        return session;
      }
    }

    return undefined;
  },

  /**
   * Find a session of given user
   * 
   * @param user 
   * @returns 
   */
  findUserSession(user: IUser): Session | undefined {
    for (const session of SessionsManager.sessions) {
      if (session.hasUser(user)) {
          return session;
      }
    }

    return undefined;
  }

};
