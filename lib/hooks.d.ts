import type { Request, Response, WsResponse } from "./adapter";
import type { Server } from "./server";
import type { Route, Websocket } from "./route";
export interface Hook {
    name: string;
    start?: (server: Server) => void;
    stop?: (server: Server) => void;
    routeAdded?: (route: Route, server: Server, success: Boolean) => void;
    routeRemoved?: (route: Route, server: Server, success: Boolean) => void;
    hookAdded?: (hook: Hook, server: Server, success: Boolean) => void;
    hookRemoved?: (hook: Hook, server: Server, success: Boolean) => void;
    before?: (request: Request, response: Response, server: Server) => void;
    after?: (request: Request, response: Response, server: Server) => void;
    wsUpgrade?: (request: Request, ws: WsResponse, server: Server) => void;
    wsMessage?: (request: Request, ws: WsResponse, message: any, server: Server) => void;
    wsClose?: (request: Request, server: Server) => void;
    wsAdded?: (ws: Websocket, server: Server, success: Boolean) => void;
    wsRemoved?: (ws: Websocket, server: Server, success: Boolean) => void;
    404?: (request: Request, response: Response, server: Server) => void;
}
