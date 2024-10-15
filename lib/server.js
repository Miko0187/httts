"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const route_1 = require("./route");
const logger_1 = require("./logger");
const defaultAdapter_1 = require("./defaultAdapter");
const ws_1 = require("ws");
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
class Server {
    constructor(options) {
        this.routes = new Map();
        this.wsRoutes = new Map();
        this.hooks = [];
        this.host = options.host;
        this.port = options.port;
        this.resources = options.resources || 'resources';
        this.logger = options.logger || new logger_1.DefaultLogger();
        this.adapter = options.adapter || new defaultAdapter_1.DefaultAdapter(this, this.logger);
        this.wss = new ws_1.Server({ noServer: true });
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
    executeHooks(which, args) {
        for (const hook of this.hooks) {
            const hookFunction = hook[which];
            if (typeof hookFunction === 'function') {
                try {
                    hookFunction(...args);
                }
                catch (error) {
                    this.logger.error(`Error in hook "${hook.name}"`);
                    if (error instanceof Error) {
                        error.stack && this.logger.error(error.stack);
                    }
                    else if (typeof error === 'string') {
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
    add(route) {
        if (this.routes.has(route.path)) {
            const methodMap = this.routes.get(route.path);
            if (methodMap === null || methodMap === void 0 ? void 0 : methodMap.has(route.method)) {
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
    remove(path, method) {
        var _a;
        const base = this.routes.get(path);
        if (!base) {
            this.logger.error(`Route "${path}" not found`);
            this.executeHooks('routeRemoved', [{ path: path }, this, false]);
            return;
        }
        const route = base.get(method);
        if (route) {
            (_a = this.routes.get(path)) === null || _a === void 0 ? void 0 : _a.delete(method);
            this.executeHooks('routeRemoved', [route, this, true]);
        }
        else {
            this.logger.error(`Route "${path}" not found`);
            this.executeHooks('routeRemoved', [{ path: path }, this, false]);
        }
    }
    /**
     * Add a WebSocket route to the server
     * @param route {Websocket} The WebSocket route to add
     */
    addWs(route) {
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
    removeWs(path) {
        const route = this.wsRoutes.get(path);
        if (route) {
            this.wsRoutes.delete(path);
            this.executeHooks('wsRemoved', [route, this, true]);
        }
        else {
            this.logger.error(`WebSocket route "${path}" not found`);
            this.executeHooks('wsRemoved', [{ path: path }, this, false]);
        }
    }
    /**
     * Add a hook to the server
     * @param hook {Hook} The hook to add
     */
    addHook(hook) {
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
    removeHook(name) {
        const beforeLength = this.hooks.length;
        let hook = this.hooks.find(h => h.name === name);
        if (hook) {
            this.hooks = this.hooks.filter(h => h.name !== name);
        }
        else {
            hook = { name };
        }
        if (beforeLength === this.hooks.length) {
            this.logger.error(`Hook "${name}" not found`);
            this.executeHooks('hookRemoved', [hook, this, false]);
        }
        else {
            this.executeHooks('hookRemoved', [hook, this, true]);
        }
    }
    /**
     * Start the server
     */
    start() {
        this.executeHooks('start', [this]);
        this.adapter.listen(this.port, this.host);
    }
    /**
     * Stop the server
     */
    stop() {
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
    upgrade(request, socket, head, httpRequest) {
        const route = this.wsRoutes.get(httpRequest.url);
        if (!route) {
            this.logger.error(`WebSocket route "${httpRequest.url}" not found`);
            return;
        }
        // Not great, but it works
        let _ws;
        const wsResponse = {
            logger: this.logger,
            send: (message) => {
                _ws.send(message);
            },
            sendJSON: (message) => {
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
    invoke(path, request, response) {
        if (path.startsWith(`/${this.resources}`)) {
            const split = path.split('/');
            const resource = split[split.length - 1];
            const extension = resource.split('.')[1];
            let contentType = 'text/plain';
            if (extension in contentTypes) {
                contentType = contentTypes[extension];
            }
            response.sendFile(`${this.resources}/${resource}`, contentType);
            return;
        }
        request.params = {};
        let base = this.routes.get(path);
        let route;
        if (base) {
            route = base.get(route_1.Methods[request.method] || route_1.Methods.GET);
        }
        else {
            for (const [routePath, methodMap] of this.routes.entries()) {
                const regex = new RegExp(`^${routePath.replace(/:\w+/g, '([a-zA-Z0-9]+)')}$`);
                const match = path.match(regex);
                if (match) {
                    route = methodMap.get(route_1.Methods[request.method] || route_1.Methods.GET);
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
        this.executeHooks('before', [request, response, this]);
        route.callback(request, response);
        this.executeHooks('after', [request, response, this]);
    }
}
exports.Server = Server;
