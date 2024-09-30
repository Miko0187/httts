import { Methods, Route } from "./route";
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
  private routes: Map<string, Map<Methods, Route>> = new Map();
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

    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Execute a hook
   * @param which {Hook} Which hook to execute
   * @param args  {any[]} Arguments to pass to the hook
   */
  executeHooks<K extends keyof Hook>(
    which: K, 
    args: any[]
  ): void {
    for (const hook of this.hooks) {
      const hookFunction = hook[which];

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

  /**
   * Add a Route to the server  
   * @param route {Route} The route to add
   */
  add(route: Route): void {
    if (this.routes.has(route.path)) {
      const methodMap = this.routes.get(route.path);
      if (methodMap?.has(route.method)) {
        this.logger.error(`Route "${route.path}" with method "${route.method}" already exists`);
        this.executeHooks('routeAdded', [route, this, false]);

        return;
      }
    }

    const methodMap = this.routes.get(route.path) || new Map();
    methodMap.set(route.method, route);

    this.routes.set(route.path, methodMap);

    this.executeHooks('routeAdded', [route, this, true]);
  }
  
  /**
   * Remove a Route from the server
   * @param path {string} The path of the route to remove
   * @param method {Methods} The method of the route to remove
   */
  remove(path: string, method: Methods): void {
    const base = this.routes.get(path);
    if (!base) {
      this.logger.error(`Route "${path}" not found`);
      this.executeHooks('routeRemoved', [{ path: path }, this, false]);

      return;
    }

    const route = base.get(method);

    if (route) {
      this.routes.get(path)?.delete(method);
      this.executeHooks('routeRemoved', [route, this, true]);
    } else {
      this.logger.error(`Route "${path}" not found`);
      this.executeHooks('routeRemoved', [{ path: path }, this, false]);
    }
  }

  /**
   * Add a hook to the server
   * @param hook {Hook} The hook to add
   */
  addHook(hook: Hook): void {
    if (this.hooks.find(h => h.name === hook.name)) {
      this.logger.error(`Hook "${hook.name}" already exists`);
      this.executeHooks('hookAdded', [hook, this, false]);

      return;
    }

    this.hooks.push(hook);
    this.executeHooks('hookAdded', [hook, this, true]);
  }

  /**
   * Remove a hook from the server
   * @param name {string} The name of the hook to remove
   */
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

  /**
   * Start the server
   */
  start(): void {
    this.executeHooks('start', [this]);
    this.adapter.listen(this.port, this.host);
  }

  /**
   * Stop the server
   */
  stop(): void {
    this.executeHooks('stop', [this]);
    this.adapter.close();
  }

  /**
   * Invoke a route (used by the adapter)
   * @param path     {string}   The path of the route to invoke
   * @param request  {Request}  The request object
   * @param response {Response} The response object
   */
  invoke(path: string, request: Request, response: Response): void {
    let base = this.routes.get(path);
    if (!base) {
      response.setStatusCode(404);
      response.send('Not found');

      this.executeHooks(404, [request, response, this]);

      return;
    }

    let route = base.get(request.method as Methods);
    request.params = {};

    if (!route) {
      let found = false;

      // Todo: Optimize this
      for (const [key, value] of this.routes.get(path) || []) {
        const regex = new RegExp(`^${key.toString().replace(/:\w+/g, '([a-zA-Z0-9]+)')}$`);
        const match = path.match(regex);

        if (match) {
          route = value;
          found = true;

          const keys = key.toString().match(/:\w+/g) || [];
          keys.forEach((key, index) => {
            request.params[key.slice(1)] = match[index + 1];
          });

          break;
        }
      }

      if (!found) {
        response.setStatusCode(404);
        response.send('Not found');

        this.executeHooks(404, [request, response, this]);

        return;
      }
    }

    this.executeHooks('before', [request, response, this]);
    route?.callback(request, response);
    this.executeHooks('after', [request, response, this]);
  }
}