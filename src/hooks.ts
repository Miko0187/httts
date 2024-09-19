import type { Request, Response } from "./adapter";
import type { Server } from "./server";

export interface Hook {
  name: string;
  before?: (request: Request, response: Response, server: Server) => void;
  after?: (request: Request, response: Response, server: Server) => void;
  404?: (request: Request, response: Response, server: Server) => void;
  start?: (server: Server) => void;
  stop?: (server: Server) => void;
}
