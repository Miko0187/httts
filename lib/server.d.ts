import { Route } from "./route";
import { Logger } from "./logger";
import type { Adapter, Response, Request } from "./adapter";
import type { Hook } from "./hooks";
interface ServerOptions {
    host: string;
    port: number;
    logger?: Logger;
    adapter?: Adapter;
}
export declare class Server {
    private routes;
    private hooks;
    logger: Logger;
    adapter: Adapter;
    readonly host: string;
    readonly port: number;
    constructor(options: ServerOptions);
    executeHooks<K extends keyof Hook>(where: K, args: any[]): void;
    add(route: Route): void;
    remove(path: string): void;
    addHook(hook: Hook): void;
    removeHook(name: string): void;
    start(): void;
    stop(): void;
    invoke(path: string, request: Request, response: Response): void;
}
export {};
