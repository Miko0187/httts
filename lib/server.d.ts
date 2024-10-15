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
    /**
     * Execute a hook
     * @param which {Hook} Which hook to execute
     * @param args  {any[]} Arguments to pass to the hook
     */
    executeHooks<K extends keyof Hook>(which: K, args: any[]): void;
    /**
     * Add a Route to the server
     * @param route {Route} The route to add
     */
    add(route: Route): void;
    /**
     * Remove a Route from the server
     * @param path {string} The path of the route to remove
     * @param method {Methods} The method of the route to remove
     */
    remove(path: string, method: Methods): void;
    addWs(route: Websocket): void;
    removeWs(path: string): void;
    addHook(hook: Hook): void;
    /**
     * Remove a hook from the server
     * @param name {string} The name of the hook to remove
     */
    removeHook(name: string): void;
    /**
     * Start the server
     */
    start(): void;
    /**
     * Stop the server
     */
    stop(): void;
    upgrade(request: any, socket: any, head: any, httpRequest: Request): void;
    invoke(path: string, request: Request, response: Response): void;
}
export {};
