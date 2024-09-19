"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAdapter = void 0;
const http_1 = __importDefault(require("http"));
const adapter_1 = require("./adapter");
const ua_parser_js_1 = require("ua-parser-js");
class DefaultAdapter extends adapter_1.Adapter {
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
            const request = {
                headers: req.headers,
                method: req.method,
                url: req.url || '/',
                host: req.headers.host || '',
                userAgent: {
                    architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
                    browser: (ua && ua.browser && ua.browser.name) || '',
                    name: (ua && ua.os && ua.os.name) || '',
                    version: (ua && ua.os && ua.os.version) || '',
                    os: (ua && ua.engine && ua.engine.name) || '',
                }
            };
            const response = {
                logger: this.logger,
                close() {
                    if (res.writableEnded) {
                        this.logger.warn('Response already sent, ignoring request to close');
                        return;
                    }
                    res.end();
                },
                send(body) {
                    res.end(body);
                },
                sendCustom(body, type) {
                    res.setHeader('Content-Type', type);
                    res.end(body);
                },
                sendFile(path) {
                    this.logger.warn('Send file not implemented');
                },
                sendJSON(body) {
                    res.setHeader('Content-Type', 'application/json');
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
                }
            };
            this.onRequest(request, response);
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
        this.logger.error('Not implemented');
    }
    onRequest(request, response) {
        this._server.invoke(request.url, request, response);
    }
}
exports.DefaultAdapter = DefaultAdapter;
