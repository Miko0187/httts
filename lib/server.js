"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const logger_1 = require("./logger");
const defaultAdapter_1 = require("./defaultAdapter");
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
};
class Server {
    constructor(options) {
        this.routes = new Map();
        this.hooks = [];
        this.host = options.host;
        this.port = options.port;
        this.resources = options.resources || 'resources';
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
    addHook(hook) {
        if (this.hooks.find(h => h.name === hook.name)) {
            this.logger.error(`Hook "${hook.name}" already exists`);
            this.executeHooks('hookAdded', [hook, this, false]);
            return;
        }
        this.hooks.push(hook);
        this.executeHooks('hookAdded', [hook, this, true]);
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
        let base = this.routes.get(path);
        if (!base) {
            response.setStatusCode(404);
            response.send('Not found');
            this.executeHooks(404, [request, response, this]);
            return;
        }
        let route = base.get(request.method);
        request.params = {};
        if (!route) {
            let found = false;
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
        route === null || route === void 0 ? void 0 : route.callback(request, response);
        this.executeHooks('after', [request, response, this]);
    }
}
exports.Server = Server;
