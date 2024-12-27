import { type IUser } from '@abybylijedno/songbook-protocol';
import { randomUUID } from '../commons/random';

export class User implements IUser {
  name?: string;
  uid?: string;

  constructor(name?: string, uid?: string) {
    this.name = name;
    this.uid = uid;
  }

  setName(name: string): string {
    this.name = name;
    return this.name;
  }

  setRandomUid(): string {
    this.uid = randomUUID();
    return this.uid;
  }

  setUid(uid: string): string {
    this.uid = uid;
    return this.uid;
  }

  toObject(): IUser {
    return {
      name: this.name,
      uid: this.uid
    };
  }

  toPublicObject(): IUser {
    return {
      name: this.name
    };
  }
}
