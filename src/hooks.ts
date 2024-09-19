import type { Request, Response } from "./adapter";
import type { Server } from "./server";

export interface Hook {
  name: string;
  start?: (server: Server) => void;
  stop?: (server: Server) => void;
  hookAdded?: (hook: Hook, server: Server, success: Boolean) => void;
  hookRemoved?: (hook: Hook, server: Server, success: Boolean) => void;
  before?: (request: Request, response: Response, server: Server) => void;
  after?: (request: Request, response: Response, server: Server) => void;
  404?: (request: Request, response: Response, server: Server) => void;
}
