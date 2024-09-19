"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const logger_1 = require("./logger");
const defaultAdapter_1 = require("./defaultAdapter");
class Server {
    constructor(options) {
        this.routes = new Map();
        this.hooks = [];
        this.host = options.host;
        this.port = options.port;
        this.logger = options.logger || new logger_1.DefaultLogger();
        this.adapter = options.adapter || new defaultAdapter_1.DefaultAdapter(this, this.logger);
        process.on('SIGINT', () => {
            this.stop();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            this.stop();
            process.exit(0);
        });
    }
    executeHooks(where, args) {
        for (const hook of this.hooks) {
            const hookFunction = hook[where];
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
    add(route) {
        if (this.routes.has(route.path)) {
            this.logger.error(`Route "${route.path}" already exists`);
            this.executeHooks('routeAdded', [route, this, false]);
            return;
        }
        this.routes.set(route.path, route);
        this.executeHooks('routeAdded', [route, this, true]);
    }
    remove(path) {
        const route = this.routes.get(path);
        if (route) {
            this.routes.delete(path);
            this.executeHooks('routeRemoved', [route, this, true]);
        }
        else {
            this.logger.error(`Route "${path}" not found`);
            this.executeHooks('routeRemoved', [{ path: path }, this, false]);
        }
    }
    addHook(hook) {
        if (this.hooks.find(h => h.name === hook.name)) {
            this.logger.error(`Hook "${hook.name}" already exists`);
            this.executeHooks('hookAdded', [hook, this, false]);
            return;
        }
        this.executeHooks('hookAdded', [hook, this, true]);
        this.hooks.push(hook);
    }
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
    start() {
        this.executeHooks('start', [this]);
        this.adapter.listen(this.port, this.host);
    }
    stop() {
        this.executeHooks('stop', [this]);
        this.adapter.close();
    }
    invoke(path, request, response) {
        let route = this.routes.get(path);
        request.params = {};
        if (!route) {
            let found = false;
            for (const [key, value] of this.routes) {
                const regex = new RegExp(`^${key.replace(/:\w+/g, '([a-zA-Z0-9]+)')}$`);
                const match = path.match(regex);
                if (match) {
                    route = value;
                    found = true;
                    const keys = key.match(/:\w+/g) || [];
                    keys.forEach((key, index) => {
                        request.params[key.slice(1)] = match[index + 1];
                    });
                    break;
                }
            }
            if (!found) {
                response.setStatusCode(404);
                response.send('Not found');
                return;
            }
        }
        this.executeHooks('before', [request, response, this]);
        route === null || route === void 0 ? void 0 : route.callback(request, response);
        this.executeHooks('after', [request, response, this]);
    }
}
exports.Server = Server;
