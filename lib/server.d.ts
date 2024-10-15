import { Methods, Route, Websocket } from "./route";
import { Logger } from "./logger";
import type { Adapter, Response, Request } from "./adapter";
import type { Hook } from "./hooks";
interface ServerOptions {
    host: string;
    port: number;
    resources?: string;
    logger?: Logger;
    adapter?: Adapter;
}
export declare class Server {
    private wss;
    private routes;
    private wsRoutes;
    private hooks;
    logger: Logger;
    adapter: Adapter;
    readonly host: string;
    readonly port: number;
    readonly resources: string;
    constructor(options: ServerOptions);
    executeHooks<K extends keyof Hook>(which: K, args: any[]): void;
    add(route: Route): void;
    remove(path: string, method: Methods): void;
    addWs(route: Websocket): void;
    removeWs(path: string): void;
    addHook(hook: Hook): void;
    removeHook(name: string): void;
    start(): void;
    stop(): void;
    upgrade(request: any, socket: any, head: any, httpRequest: Request): void;
    invoke(path: string, request: Request, response: Response): void;
}
export {};
