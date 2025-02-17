import { randomTicket } from '../../commons/random';
import {
  type ISessionDetails,
  type IUser,
  SessionMemberRole,
  ErrorCode,
} from '@abybylijedno/songbook-protocol';
import { ErrorSession } from './ErrorSession';
import { getExpirationDate } from './utils';
import { SessionMember } from './SessionMember';


/**
 * Session
 */
export class Session implements ISessionDetails {

  public id: string;
  public expires: Date;
  public members: SessionMember[];

  constructor(creator: IUser) {
    this.id = randomTicket(4);
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

  /**
   * Send session details to all members
   */
  sendDetailsToEveryMember() {
    for(const member of this.members) {
      member.connection?.sendSessionDetails();
    }
  }

  toObjectForUser(user: IUser) {
    return {
      id: this.id,
      expires: this.expires,
      members: this.members.map(member => member.toObjectForUser(user))
    }
  }

}
