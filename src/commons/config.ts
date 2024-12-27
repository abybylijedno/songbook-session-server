import { exitMissingRequiredEnv } from './exits';

/**
 * Get an environment variable or a default value
 * @param {string} name Name of the environment variable
 * @param {string|null} [defaultValue] Default value
 * @returns {string|null} Returns the environment variable or the default value
 */
const getEnv = (name: string, defaultValue: string | null = null): string | null => {
  return process.env[name] || defaultValue;
};

/**
 * Get an environment variable or throw an error
 * @param {string} name Name of the environment variable
 * @returns {string} Returns the environment variable
 * @throws {EnvNotFoundError} Throws an error if the environment variable is not set
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    exitMissingRequiredEnv(name);
    return '';
  }
  return value;
}


const IS_PRODUCTION = getEnv('NODE_ENV', 'dev') === 'production';

export {
  getEnv,
  requireEnv,
  IS_PRODUCTION
};
