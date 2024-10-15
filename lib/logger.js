"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultLogger = void 0;
class DefaultLogger {
    error(message) {
        console.error(`\x1b[31;1m[ERROR] \x1b[31m${message}\x1b[0m`);
    }
    warn(message) {
        console.warn(`\x1b[33;1m[WARN] \x1b[33m${message}\x1b[0m`);
    }
    ;
    info(message) {
        console.info(`\x1b[32;1m[INFO] \x1b[32m${message}\x1b[0m`);
    }
    debug(message) {
        if (process.env.NODE_ENV === "development")
            console.log(`\x1b[34;1m[DEBUG] \x1b[34m${message}\x1b[0m`);
    }
}
exports.DefaultLogger = DefaultLogger;
