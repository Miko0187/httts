import type { Request, Response } from "./adapter";
import type { Server } from "./server";
import type { Route } from "./route";

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
  404?: (request: Request, response: Response, server: Server) => void;
}
