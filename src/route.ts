import type { Request, Response } from "./adapter";

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