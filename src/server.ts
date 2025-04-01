import { Methods, Route, Websocket } from "./route";
import { DefaultLogger, Logger } from "./logger";
import { HttpAdapter, HttpsAdapter } from "./defaultAdapter";
import { Server as WsServer } from "ws";
import type { Adapter, Response, Request, WsResponse } from "./adapter";
import type { Hook } from "./hooks";

const contentTypes = {
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg+xml',
  'gif': 'image/gif',
  'ico': 'image/x-icon',
  'webp': 'image/webp',
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'ogg': 'audio/ogg',
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'zip': 'application/zip',
  'gz': 'application/gzip',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
};

interface ServerOptions {
  host: string;
  port: number;
  resources?: string;
  logger?: Logger;
  adapter?: Adapter;
  keyPath?: string;
  certPath?: string;
  debug?: boolean;
}

export class Server {
  private wss: WsServer;

  private routes: Map<string, Map<Methods, Route>> = new Map();
  private wsRoutes: Map<string, Websocket> = new Map();
  private hooks: Hook[] = [];

  public logger: Logger;
  public adapter: Adapter;

  public readonly options: ServerOptions;
  public readonly host: string;
  public readonly port: number;
  public readonly resources: string;
  public readonly debug: boolean;

  constructor(options: ServerOptions) {
    this.options = options;
    this.host = options.host;
    this.port = options.port;
    this.resources = options.resources || 'resources';
    this.debug = options.debug || false;
    this.logger = options.logger || new DefaultLogger();
    this.adapter = options.adapter || (options.certPath && options.keyPath ? new HttpsAdapter(this, options.keyPath, options.certPath, this.logger) : new HttpAdapter(this, this.logger));
    this.wss = new WsServer({ noServer: true });
  }

  /**
   * Execute a hook
   * @param which {Hook} Which hook to execute
   * @param args  {any[]} Arguments to pass to the hook
   * @returns {boolean} Whether to cancel the operation
   */
  executeHooks<K extends keyof Hook>(
    which: K, 
    args: any[]
  ): boolean {
    let cancel = false;

    for (const hook of this.hooks) {
      const hookFunction = hook[which];

      if (typeof hookFunction === 'function') {
        try {
          const result = (hookFunction as (...args: any[]) => any)(...args);

          if (result !== undefined && which === "before" && typeof result === "boolean") {
            cancel = result;
          }
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

    return cancel;
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
   * Add a WebSocket route to the server
   * @param route {Websocket} The WebSocket route to add
   */
  addWs(route: Websocket): void {
    if (this.wsRoutes.has(route.path)) {
      this.logger.error(`WebSocket route "${route.path}" already exists`);
      this.executeHooks('wsAdded', [route, this, false]);

      return;
    }

    this.wsRoutes.set(route.path, route);
    this.executeHooks('wsAdded', [route, this, true]);
  }

  /**
   * Remove a WebSocket route from the server
   * @param path {string} The path of the WebSocket route to remove
   */
  removeWs(path: string): void {
    const route = this.wsRoutes.get(path);
    if (route) {
      this.wsRoutes.delete(path);
      this.executeHooks('wsRemoved', [route, this, true]);
    } else {
      this.logger.error(`WebSocket route "${path}" not found`);
      this.executeHooks('wsRemoved', [{ path: path }, this, false]);
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
   * Upgrade a request to a WebSocket connection (used by the adapter)
   * @param request  {Request} The request object
   * @param socket  {any}    The socket object
   * @param head    {any}    The head object
   * @param httpRequest {Request} The HTTP request object
   */
  upgrade(request: any, socket: any, head: any, httpRequest: Request): void {
    const route = this.wsRoutes.get(httpRequest.url);
    if (!route) {
      this.logger.error(`WebSocket route "${httpRequest.url}" not found`);
      return;
    }

    // Not great, but it works
    let _ws: any;

    const wsResponse: WsResponse = {
      logger: this.logger,
      send: (message: string) => {
        _ws.send(message);
      },
      sendJSON: (message: Record<string, unknown>) => {
        _ws.send(JSON.stringify(message));
      },
      close: () => {
        if (wsResponse.closed) {
          return;
        }

        wsResponse.closed = true;
        socket.close();
      },
      closed: false,
    };

    this.executeHooks('wsUpgrade', [httpRequest, wsResponse, this]);
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      _ws = ws;

      if (route.opened) {
        route.opened(httpRequest, wsResponse);
      }

      ws.on('message', (message) => {
        this.executeHooks('wsMessage', [httpRequest, wsResponse, message, this]);
        if (route.message) {
          route.message(httpRequest, wsResponse, message.toString());
        }
      });

      ws.on('close', () => {
        this.executeHooks('wsClose', [httpRequest, this]);
        if (route.closing) {
          route.closing(httpRequest);
        }
      });
    });
  }

  /**
   * Invoke a route (used by the adapter)
   * @param path     {string}   The path of the route to invoke
   * @param request  {Request}  The request object
   * @param response {Response} The response object
   */
  invoke(path: string, request: Request, response: Response): void {
    if (path.startsWith(`/${this.resources}`)) {
      const split = path.split('/');
      const resource = split[split.length - 1];
      const extension = resource.split('.')[1];
      let contentType = 'text/plain';

      if (extension in contentTypes) {
        contentType = contentTypes[extension as keyof typeof contentTypes];
      }

      response.sendFile(`${this.resources}/${resource}`, contentType);
      return;
    }

    request.params = {};

    let base = this.routes.get(path);
    let route: Route | undefined;

    if (base) {
      route = base.get(Methods[request.method as keyof typeof Methods] || Methods.GET);
    } else {
      for (const [routePath, methodMap] of this.routes.entries()) {
        const regex = new RegExp(`^${routePath.replace(/:\w+/g, '([a-zA-Z0-9]+)')}$`);
        const match = path.match(regex);

        if (match) {
          route = methodMap.get(Methods[request.method as keyof typeof Methods] || Methods.GET);
          if (route) {
            const keys = routePath.match(/:\w+/g) || [];
            keys.forEach((key, index) => {
              request.params[key.slice(1)] = match[index + 1];
            });
          }
          break;
        }
      }
    }

    if (!route) {
      response.setStatusCode(404);
      response.send('Not found');
      
      this.executeHooks(404, [request, response, this]);
      return;
    }

    if (this.executeHooks('before', [request, response, this])) {
      return;
    }
    route.callback(request, response);
    this.executeHooks('after', [request, response, this]);
  }
}