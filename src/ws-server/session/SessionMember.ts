import {
  type IUser,
  SessionMemberRole,
  type ISessionMember
} from '@abybylijedno/songbook-protocol';
import { ConnectionsManager } from '../connection/ConnectionsManager';
import { Connection } from '../connection/Connection';


/**
 * Session member
 */
export class SessionMember implements ISessionMember {
  user: IUser;
  role: SessionMemberRole;

  constructor(user: IUser, role: SessionMemberRole = SessionMemberRole.Member) {
    this.user = user;
    this.role = role;
  }

  get connection(): Connection | undefined {
    return ConnectionsManager.findConnectionOfUser(this.user);
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
