import { DateTime } from "luxon";


/**
 * Get expiration date
 * 
 * @returns Date
 */
export const getExpirationDate = () => DateTime.now().plus({ hours: 2 }).toJSDate();
