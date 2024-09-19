import { Route } from "./route";
import { DefaultLogger, Logger } from "./logger";
import { DefaultAdapter } from "./defaultAdapter";
import type { Adapter, Response, Request } from "./adapter";
import type { Hook } from "./hooks";

interface ServerOptions {
  host: string;
  port: number;
  logger?: Logger;
  adapter?: Adapter;
}

export class Server {
  private routes: Map<string, Route> = new Map();
  private hooks: Hook[] = [];

  public logger: Logger;
  public adapter: Adapter;

  public readonly host: string;
  public readonly port: number;

  constructor(
    // public readonly host: string,
    // public readonly port: number,
    // private logger: Logger = new DefaultLogger(),
    // private adapter: Adapter = new DefaultAdapter(this, logger)
    options: ServerOptions
  ) {
    this.host = options.host;
    this.port = options.port;
    this.logger = options.logger || new DefaultLogger();
    this.adapter = options.adapter || new DefaultAdapter(this, this.logger);
  }

  executeHooks<K extends keyof Hook>(
    where: K, 
    args: any[]
  ): void {
    for (const hook of this.hooks) {
      const hookFunction = hook[where];
      if (typeof hookFunction === 'function') {
        try {
          (hookFunction as (...args: any[]) => any)(...args);
        } catch (error) {
          this.logger.error(`Error in hook "${hook.name}"`);
          if (error instanceof Error) {
            error.stack && this.logger.error(error.stack);
          } else if (typeof error === 'string') {
            this.logger.error(error);
          }
        }
      }
    }
  }

  add(route: Route): void {
    this.routes.set(route.path, route);
  }
  
  remove(path: string): void {
    this.routes.delete(path);
  }

  addHook(hook: Hook): void {
    this.hooks.push(hook);
  }

  removeHook(name: string): void {
    const beforeLength = this.hooks.length;

    this.hooks = this.hooks.filter(hook => hook.name !== name);

    if (beforeLength === this.hooks.length) {
      this.logger.warn(`Hook "${name}" not found`);
    }
  }

  start(): void {
    this.executeHooks('start', [this]);

    this.adapter.listen(this.port, this.host);
  }

  stop(): void {
    this.executeHooks('stop', [this]);

    this.adapter.close();
  }

  invoke(path: string, request: Request, response: Response): void {
    const route = this.routes.get(path);

    if (!route) {
      this.executeHooks(404, [request, response, this]);

      response.setStatusCode(404);
      response.send('404 Not Found');

      return;
    }

    this.executeHooks('before', [request, response, this]);

    route.callback(request, response);

    this.executeHooks('after', [request, response, this]);
  }
}