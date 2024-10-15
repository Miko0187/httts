export interface Logger {
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
}
export declare class DefaultLogger implements Logger {
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
}
