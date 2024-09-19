import { Logger, DefaultLogger } from "./logger";

export interface UserAgent {
  name: string;
  version: string;
  browser: string;
  os: string;
  architecture: string;
}

export interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  userAgent: UserAgent;
  host: string;
  params: Record<string, string>;
}

export interface Response {
  logger: Logger;
  setStatusCode: (statusCode: number) => void;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
  sendCustom(body: Buffer | string, type: string): void;
  sendJSON: (body: Record<string, unknown>) => void;
  sendFile: (path: string) => void;
  redirect: (statusCode: number, url: string) => void;
  close: () => void;
}

export abstract class Adapter {
  protected logger: Logger;

  constructor(logger?: Logger) {
    if (!logger) {
      this.logger = new DefaultLogger();
    } else {
      this.logger = logger;
    }
  }

  abstract onRequest(request: Request, response: Response): void;
  abstract onError(callback: (error: Error) => void): void;
  abstract listen(port: number, host: string): void;
  abstract close(): void;
}
