import { Session } from './Session';
import {
  SessionDeleteReason,
  type IUser
} from '@abybylijedno/songbook-protocol';
import { Duration, DurationLikeObject } from 'luxon';

import { getSubLogger } from "../../commons/logger";
const logger = getSubLogger("SessionsManager");


/**
 * SessionsManager
 */
export const SessionsManager = {

  sessions: [] as Session[],
  cleanerInterval: undefined as NodeJS.Timeout | undefined,

  /**
   * Create a new session
   * 
   * @param session 
   * @returns 
   */
  createSession(user: IUser): Session {
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
    const session = SessionsManager.getSessionById(id);
    if (!session) {
      return undefined;
    }

    SessionsManager.deleteSessionAndNotifyMembers(session, SessionDeleteReason.CreatorsDecision);
  },

  /**
   * Delete a session and notify all members
   * 
   * @param session Session to delete 
   * @param deleteReason Reason for deletion
   */
  deleteSessionAndNotifyMembers(session: Session, deleteReason: SessionDeleteReason) {
    // Notify all members about session expiration
    for (let j = 0; j < session.members.length; j++) {
      const member = session.members[j];
      if (!member) {
        continue;
      }

      member.connection?.notifyAboutSessionDeletion(deleteReason);
    }

    // Remove session
    const idx = SessionsManager.sessions.indexOf(session);
    SessionsManager.sessions.splice(idx, 1);
  },

  /**
   * Delete expired sessions
   */
  deleteExpiredSessions() {
    const now = new Date();

    for (let i = 0; i < SessionsManager.sessions.length; i++) {
      const session = SessionsManager.sessions[i];
      if (!session) {
        continue;
      }

      if (session.expires <= now) {
        logger.info(`Session ${session.id} has expired - removing members and session`);
        SessionsManager.deleteSessionAndNotifyMembers(session, SessionDeleteReason.Expired);
      }
    }
  },

  /**
   * Start the cleaner
   */
  startCleaner(interval: DurationLikeObject) {
    const dur = Duration.fromObject(interval);
    logger.info(`Starting session cleaner with interval ${dur.toHuman()}`);
    SessionsManager.cleanerInterval = setInterval(() => {
      SessionsManager.deleteExpiredSessions();
    }, dur.toMillis());
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
