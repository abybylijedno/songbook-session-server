import { randomTicket } from '../commons/random';
import {
  type IUser,
  SessionMemberRole,
  type ISessionMember,
  type ISessionDetails,
  ErrorCode,
} from '@abybylijedno/songbook-protocol';
import { ConnectionsManager } from './ConnectionsManager';
import { DateTime } from "luxon";


const getExpirationDate = () => DateTime.now().plus({ hours: 2 }).toJSDate();


class SessionMember implements ISessionMember {
  user: IUser;
  role: SessionMemberRole;

  constructor(user: IUser, role: SessionMemberRole = SessionMemberRole.Member) {
    this.user = user;
    this.role = role;
  }

  get connection() {
    for (const [ws, connection] of ConnectionsManager.connections) {
      if (connection.user.uid === this.user.uid) {
        return connection;
      }
    }
  }

  toObjectForUser(user: IUser) {
    return {
      user: {
        name: this.user.name,
        uid: this.user.uid === user.uid ? this.user.uid : undefined
      },
      role: this.role
    }
  }
}

export class ErrorSession extends Error {
  constructor(public code: ErrorCode) {
    super("Session error");
  }
}

export class Session implements ISessionDetails {

  public id: string;
  public expires: Date;
  public members: SessionMember[];

  constructor(creator: IUser) {
    this.id = randomTicket();
    this.expires = getExpirationDate(); 
    this.members = [
      new SessionMember(
        creator,
        SessionMemberRole.Creator
      )
    ];
  }

  /**
   * Get the creator of the session
   */
  get creator() {
    return this.members.find(member => member.role === SessionMemberRole.Creator)?.user;
  }

  /**
   * Refresh expiration date
   */
  refreshExpirationDate() {
    this.expires = getExpirationDate();
  }

  /**
   * Add user to session as a member
   * 
   * @param user 
   */
  addUser(user: IUser) {
    this.members.push(new SessionMember(user));
  }

  /**
   * Remove user from session
   * 
   * @param user 
   */
  removeUser(user: IUser) {
    const idx = this.members.findIndex(member => member.user.uid === user.uid);

    if (idx === -1) {
      throw new ErrorSession(ErrorCode.SessionYouAreNotMember);
    } else if (this.members[idx] && this.members[idx].role === SessionMemberRole.Creator) {
      throw new ErrorSession(ErrorCode.SessionCannotLeaveAsCreator);
    }

    this.members.splice(idx, 1);
  }

  /**
   * Check if user is in the session
   * 
   * @param user 
   * @returns 
   */
  hasUser(user: IUser) {
    return this.members.some(member => member.user.uid === user.uid);
  }

  toObjectForUser(user: IUser) {
    return {
      id: this.id,
      expires: this.expires,
      members: this.members.map(member => member.toObjectForUser(user))
    }
  }

}
