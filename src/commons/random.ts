import { randomUUID, randomInt } from 'node:crypto';

const randomTicket = (length: number) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 10);
  }
  return result;
}

export {
  randomUUID,
  randomTicket
};
