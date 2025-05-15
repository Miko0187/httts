"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsAdapter = exports.HttpAdapter = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const adapter_1 = require("./adapter");
const ua_parser_js_1 = require("ua-parser-js");
const promises_1 = require("fs/promises");
class HttpAdapter extends adapter_1.Adapter {
    constructor(_server, logger) {
        super(logger);
        this._server = _server;
        this.running = false;
        this.server = http_1.default.createServer((req, res) => {
            if (!this.running) {
                this.logger.warn('Server is not running, ignoring request');
                return;
            }
            let ua;
            if (req.headers['user-agent']) {
                const parser = new ua_parser_js_1.UAParser(req.headers['user-agent']);
                ua = parser.getResult();
            }
            else {
                this.logger.warn('User-Agent header not found');
                ua = undefined;
            }
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            const _this = this;
            req.on('end', function () {
                const request = {
                    headers: req.headers || {},
                    method: req.method || '',
                    url: req.url || '/',
                    host: req.socket.remoteAddress,
                    port: req.socket.remotePort,
                    userAgent: {
                        architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
                        browser: (ua && ua.browser && ua.browser.name) || '',
                        name: (ua && ua.os && ua.os.name) || '',
                        version: (ua && ua.os && ua.os.version) || '',
                        os: (ua && ua.engine && ua.engine.name) || '',
                    },
                    body: body,
                };
                const response = {
                    logger: _this.logger,
                    close() {
                        if (res.writableEnded) {
                            this.logger.warn('Response already sent, ignoring request to close');
                            return;
                        }
                        res.end();
                    },
                    send(body) {
                        if (!res.getHeader('Content-Type')) {
                            res.setHeader('Content-Type', 'text/plain');
                        }
                        res.end(body);
                    },
                    sendCustom(body, type) {
                        res.setHeader('Content-Type', type);
                        res.end(body);
                    },
                    sendFile(path, type) {
                        (0, promises_1.open)(path, 'r').then(file => {
                            res.setHeader('Content-Type', type);
                            file.readFile({ encoding: 'utf-8' }).then(data => {
                                res.end(data);
                            }).catch(err => {
                                _this.logger.error(`Error reading file: ${err}`);
                                res.statusCode = 500;
                                res.end();
                            });
                            file.close();
                        }).catch(err => {
                            _this.logger.error(`Error reading file: ${err}`);
                            res.statusCode = 500;
                            res.end();
                        });
                    },
                    sendJSON(body) {
                        if (!res.getHeader('Content-Type')) {
                            res.setHeader('Content-Type', 'application/json');
                        }
                        res.end(JSON.stringify(body));
                    },
                    setHeader(name, value) {
                        res.setHeader(name, value);
                    },
                    setStatusCode(statusCode) {
                        res.statusCode = statusCode;
                    },
                    redirect(statusCode, path) {
                        res.statusCode = statusCode;
                        res.setHeader('Location', path);
                        res.end();
                    },
                    write(body) {
                        res.write(body);
                    },
                };
                _this.onRequest(request, response);
            });
        });
        this.server.on('upgrade', (req, socket, head) => {
            let ua;
            if (req.headers['user-agent']) {
                const parser = new ua_parser_js_1.UAParser(req.headers['user-agent']);
                ua = parser.getResult();
            }
            else {
                this.logger.warn('User-Agent header not found');
                ua = undefined;
            }
            const request = {
                headers: req.headers || {},
                method: req.method || '',
                url: req.url || '/',
                host: req.headers.host || '',
                userAgent: {
                    architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
                    browser: (ua && ua.browser && ua.browser.name) || '',
                    name: (ua && ua.os && ua.os.name) || '',
                    version: (ua && ua.os && ua.os.version) || '',
                    os: (ua && ua.engine && ua.engine.name) || '',
                },
                body: '',
            };
            this.onUpgrade(req, socket, head, request);
        });
    }
    close() {
        this.running = false;
        this.server.close();
    }
    listen(port, host) {
        if (this.running) {
            this.logger.warn('Server is already running, ignoring request to start');
            return;
        }
        this.running = true;
        this.server.listen(port, host);
    }
    onError(callback) {
        this.server.on('error', callback);
    }
    onRequest(request, response) {
        this._server.invoke(request.url, request, response);
    }
    onUpgrade(request, socket, head, httpRequest) {
        this._server.upgrade(request, socket, head, httpRequest);
    }
}
exports.HttpAdapter = HttpAdapter;
class HttpsAdapter extends adapter_1.Adapter {
    constructor(_server, keyPath, certPath, logger) {
        super(logger);
        this._server = _server;
        this.running = false;
        this.server = https_1.default.createServer({
            key: fs_1.default.readFileSync(keyPath),
            cert: fs_1.default.readFileSync(certPath)
        }, (req, res) => {
            if (!this.running) {
                this.logger.warn('Server is not running, ignoring request');
                return;
            }
            let ua;
            if (req.headers['user-agent']) {
                const parser = new ua_parser_js_1.UAParser(req.headers['user-agent']);
                ua = parser.getResult();
            }
            else {
                this.logger.warn('User-Agent header not found');
                ua = undefined;
            }
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            const _this = this;
            req.on('end', function () {
                const request = {
                    headers: req.headers || {},
                    method: req.method || '',
                    url: req.url || '/',
                    host: req.socket.remoteAddress,
                    port: req.socket.remotePort,
                    userAgent: {
                        architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
                        browser: (ua && ua.browser && ua.browser.name) || '',
                        name: (ua && ua.os && ua.os.name) || '',
                        version: (ua && ua.os && ua.os.version) || '',
                        os: (ua && ua.engine && ua.engine.name) || '',
                    },
                    body: body,
                };
                const response = {
                    logger: _this.logger,
                    close() {
                        if (res.writableEnded) {
                            this.logger.warn('Response already sent, ignoring request to close');
                            return;
                        }
                        res.end();
                    },
                    send(body) {
                        if (!res.getHeader('Content-Type')) {
                            res.setHeader('Content-Type', 'text/plain');
                        }
                        res.end(body);
                    },
                    sendCustom(body, type) {
                        res.setHeader('Content-Type', type);
                        res.end(body);
                    },
                    sendFile(path, type) {
                        (0, promises_1.open)(path, 'r').then(file => {
                            res.setHeader('Content-Type', type);
                            file.readFile({ encoding: 'utf-8' }).then(data => {
                                res.end(data);
                            }).catch(err => {
                                _this.logger.error(`Error reading file: ${err}`);
                                res.statusCode = 500;
                                res.end();
                            });
                            file.close();
                        }).catch(err => {
                            _this.logger.error(`Error reading file: ${err}`);
                            res.statusCode = 500;
                            res.end();
                        });
                    },
                    sendJSON(body) {
                        if (!res.getHeader('Content-Type')) {
                            res.setHeader('Content-Type', 'application/json');
                        }
                        res.end(JSON.stringify(body));
                    },
                    setHeader(name, value) {
                        res.setHeader(name, value);
                    },
                    setStatusCode(statusCode) {
                        res.statusCode = statusCode;
                    },
                    redirect(statusCode, path) {
                        res.statusCode = statusCode;
                        res.setHeader('Location', path);
                        res.end();
                    },
                    write(body) {
                        res.write(body);
                    },
                };
                _this.onRequest(request, response);
            });
        });
        this.server.on('upgrade', (req, socket, head) => {
            let ua;
            if (req.headers['user-agent']) {
                const parser = new ua_parser_js_1.UAParser(req.headers['user-agent']);
                ua = parser.getResult();
            }
            else {
                this.logger.warn('User-Agent header not found');
                ua = undefined;
            }
            const request = {
                headers: req.headers || {},
                method: req.method || '',
                url: req.url || '/',
                host: req.headers.host || '',
                userAgent: {
                    architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
                    browser: (ua && ua.browser && ua.browser.name) || '',
                    name: (ua && ua.os && ua.os.name) || '',
                    version: (ua && ua.os && ua.os.version) || '',
                    os: (ua && ua.engine && ua.engine.name) || '',
                },
                body: '',
            };
            this.onUpgrade(req, socket, head, request);
        });
    }
    close() {
        this.running = false;
        this.server.close();
    }
    listen(port, host) {
        if (this.running) {
            this.logger.warn('Server is already running, ignoring request to start');
            return;
        }
        this.running = true;
        this.server.listen(port, host);
    }
    onError(callback) {
        this.server.on('error', callback);
    }
    onRequest(request, response) {
        this._server.invoke(request.url, request, response);
    }
    onUpgrade(request, socket, head, httpRequest) {
        this._server.upgrade(request, socket, head, httpRequest);
    }
}
exports.HttpsAdapter = HttpsAdapter;
