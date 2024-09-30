"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingHook = void 0;
exports.loggingHook = {
    name: 'logging',
    before(request, response, server) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
        server.logger.info(`${request.host} (${timestamp}) [${request.method}] ${request.url}`);
        return [request, response];
    },
    "404": (request, response, server) => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
        server.logger.warn(`${request.host} (${timestamp}) [404] ${request.url}`);
    },
    start(server) {
        server.logger.info(`Server started on http://${server.host}:${server.port}`);
    },
    hookAdded(hook, server, success) {
        if (success) {
            server.logger.debug(`Hook "${hook.name}" added`);
        }
    },
    hookRemoved(hook, server, success) {
        if (success) {
            server.logger.debug(`Hook "${hook.name}" removed`);
        }
    },
    routeAdded(route, server, success) {
        if (success) {
            server.logger.debug(`Route [${route.method}] "${route.path}" added`);
        }
    },
    routeRemoved(route, server, success) {
        if (success) {
            server.logger.debug(`Route "${route.path}" removed`);
        }
    },
    stop(server) {
        server.logger.info(`Server stopped`);
    }
};
