import { ErrorCode } from '@abybylijedno/songbook-protocol';


/**
 * ErrorSession
 */
export class ErrorSession extends Error {
  constructor(public code: ErrorCode) {
    super("Session error");
  }
}
