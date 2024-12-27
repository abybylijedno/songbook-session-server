import { Logger } from 'tslog';
import { fileURLToPath } from 'url';
import { FILE_PREFIX } from './constants';
import { getEnv, IS_PRODUCTION } from './config';
import { exitInvalidLogLevel } from './exits';

const REGEX = /\/([^/]+)\/([^/]+)\.[jt]s$/;


const LOG_LEVELS = [
    'silly', // 0
    'trace', // 1
    'debug', // 2
    'info',  // 3
    'warn',  // 4
    'error', // 5
    'fatal'  // 6
]
const LOG_LEVEL = getEnv('LOG_LEVEL', IS_PRODUCTION ? 'info' : 'debug') as string;
const LOG_LEVEL_INDEX = LOG_LEVELS.indexOf(LOG_LEVEL);
if (LOG_LEVEL_INDEX === -1) {
    exitInvalidLogLevel(LOG_LEVEL);
}

const logger = new Logger({
    hideLogPositionForProduction: true,
    minLevel: LOG_LEVEL_INDEX
});

const getSubLogger = (param: string) => {
    let name: string | undefined;

    if (param.startsWith(FILE_PREFIX)) {
        name = fileURLToPath(param);
        const match = name.match(REGEX);
        if (match) {
            if (match[2] === 'index') {
                name = match[1];
            } else {
                name = match[2];
            }
        }
    } else {
        name = param;
    }

    return logger.getSubLogger({ name });
}

export {
    logger,
    getSubLogger
};
