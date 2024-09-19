export interface Logger {
  error(message: string): void
  warn(message: string): void  
  info(message: string): void
  debug(message: string): void
}

export class DefaultLogger implements Logger {
  public error(message: string) {
    console.error(`\x1b[31;1m[ERROR] \x1b[31m${message}\x1b[0m`);
  }

  public warn(message: string) {
    console.warn(`\x1b[33;1m[WARN] \x1b[33m${message}\x1b[0m`);
  };
  
  public info(message: string) {
    console.info(`\x1b[32;1m[INFO] \x1b[32m${message}\x1b[0m`);
  }

  public debug(message: string) {
    if (process.env.NODE_ENV === "development") console.log(`\x1b[34;1m[DEBUG] \x1b[34m${message}\x1b[0m`);
  }
}
