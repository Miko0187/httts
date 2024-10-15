import { Adapter, Request, Response } from "./adapter";
import type { Logger } from "./logger";
import type { Server } from "./server";
export declare class DefaultAdapter extends Adapter {
    private readonly _server;
    private server;
    private running;
    constructor(_server: Server, logger?: Logger);
    close(): void;
    listen(port: number, host: string): void;
    onError(callback: (error: Error) => void): void;
    onRequest(request: Request, response: Response): void;
    onUpgrade(request: any, socket: any, head: any, httpRequest: Request): void;
}
