import { randomUUID, randomInt } from 'node:crypto';

const randomTicket = (length = 8) => {
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
