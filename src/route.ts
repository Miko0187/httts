import type { Request, Response, WsResponse } from "./adapter";

/**
 * HTTP methods
 */
export enum Methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
}

/**
 * Route definition
 */
export interface Route {
  method: Methods;
  path: string;
  callback: (req: Request, res: Response) => void;
}

export interface Websocket {
  path: string;
  opened?: (request: Request, response: WsResponse) => void;
  message?: (request: Request, response: WsResponse, message: string) => void;
  closing?: (request: Request) => void;
}
