import type { Hook } from "./hooks";

function getDate(): string {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

  return timestamp;
}

export const loggingHook: Hook = {
  name: 'logging',
  before(request, response, server) {
    server.logger.info(`${request.host} (${getDate()}) [${request.method}] ${request.url}`);

    return;
  },
  "404": (request, response, server) => {
    server.logger.warn(`${request.host} (${getDate()}) [404] ${request.url}`);
  },
  start(server) {
    if (server.options.certPath && server.options.keyPath) {
      server.logger.info(`Server started on https://${server.host}:${server.port}`);
    } else {
      server.logger.info(`Server started on http://${server.host}:${server.port}`);
    }
  },
  hookAdded(hook, server, success) {
    if (server.debug) server.logger.debug(`Hook "${hook.name}" added`);
  },
  hookRemoved(hook, server, success) {
    if (server.debug) server.logger.debug(`Hook "${hook.name}" removed`);
  },
  routeAdded(route, server, success) {
    if (server.debug) server.logger.debug(`Route [${route.method}] "${route.path}" added`);
  },
  routeRemoved(route, server, success) {
    if (server.debug) server.logger.debug(`Route "${route.path}" removed`);
  },
  stop(server) {
    server.logger.info(`Server stopped`);
  },
  wsUpgrade(request, ws, server) {
    server.logger.info(`${request.host} (${getDate()}) [WS] ${request.url}`);
  },
  wsAdded(ws, server, success) {
    if (server.debug) server.logger.debug(`WebSocket "${ws.path}" added`);
  },
  wsRemoved(ws, server, success) {
    if (server.debug) server.logger.debug(`WebSocket "${ws.path}" removed`);
  },
  wsClose(request, server) {
    server.logger.info(`${request.host} (${getDate()}) [WS] ${request.url} closed`);
  },
};