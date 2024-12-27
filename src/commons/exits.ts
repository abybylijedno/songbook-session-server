const exitInvalidLogLevel = (logLevel: string) => {
  console.error(`Invalid log level: ${logLevel}`);
  process.exit(100);
}

const exitMissingRequiredEnv = (name: string) => {
  console.error(`Missing environment variable ${name}`);
  process.exit(110);
}

export {
  exitInvalidLogLevel,
  exitMissingRequiredEnv
};
