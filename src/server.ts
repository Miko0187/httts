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

  constructor(options: ServerOptions) {
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
    if (this.routes.has(route.path)) {
      this.logger.error(`Route "${route.path}" already exists`);
      this.executeHooks('routeAdded', [route, this, false]);

      return;
    }

    this.routes.set(route.path, route);
    this.executeHooks('routeAdded', [route, this, true]);
  }
  
  remove(path: string): void {
    const route = this.routes.get(path);

    if (route) {
      this.routes.delete(path);
      this.executeHooks('routeRemoved', [route, this, true]);
    } else {
      this.logger.error(`Route "${path}" not found`);
      this.executeHooks('routeRemoved', [{ path: path }, this, false]);
    }
  }

  addHook(hook: Hook): void {
    if (this.hooks.find(h => h.name === hook.name)) {
      this.logger.error(`Hook "${hook.name}" already exists`);
      this.executeHooks('hookAdded', [hook, this, false]);

      return;
    }

    this.executeHooks('hookAdded', [hook, this, true]);
    this.hooks.push(hook);
  }

  removeHook(name: string): void {
    const beforeLength = this.hooks.length;
    let hook = this.hooks.find(h => h.name === name);

    if (hook) {
      this.hooks = this.hooks.filter(h => h.name !== name);
    } else {
      hook = { name };
    }

    if (beforeLength === this.hooks.length) {
      this.logger.error(`Hook "${name}" not found`);
      this.executeHooks('hookRemoved', [hook, this, false]);
    } else {
      this.executeHooks('hookRemoved', [hook, this, true]);
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