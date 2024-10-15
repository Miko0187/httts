import http from 'http';
import { Adapter, Request, Response, UserAgent, WsResponse } from "./adapter";
import { UAParser, IResult } from "ua-parser-js";
import { open } from 'fs/promises';
import type { Logger } from "./logger";
import type { Server } from "./server";

export class DefaultAdapter extends Adapter {
  private server: http.Server;
  private running: boolean = false;

  constructor(private readonly _server: Server, logger?: Logger) {
    super(logger);

    this.server = http.createServer((req, res) => {
      if (!this.running) {
        this.logger.warn('Server is not running, ignoring request');
        return;
      }

      let ua: IResult | undefined;

      if (req.headers['user-agent']) {
        const parser = new UAParser(req.headers['user-agent']);
        ua = parser.getResult();
      } else {
        this.logger.warn('User-Agent header not found');
        ua = undefined;
      }

      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      const _this = this;

      req.on('end', function () {
        const request = <Request>{
          headers: req.headers || {},
          method: req.method || '',
          url: req.url || '/',
          host: req.headers.host || '',
          userAgent: <UserAgent>{
            architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
            browser: (ua && ua.browser && ua.browser.name) || '',
            name: (ua && ua.os && ua.os.name) || '',
            version: (ua && ua.os && ua.os.version) || '',
            os: (ua && ua.engine && ua.engine.name) || '',
          },
          body: body,
        }
  
        const response: Response = {
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
            open(path, 'r').then(file => {
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
        }
  
        _this.onRequest(request, response);
      });
    });

    this.server.on('upgrade', (req, socket, head) => {
      let ua: IResult | undefined;

      if (req.headers['user-agent']) {
        const parser = new UAParser(req.headers['user-agent']);
        ua = parser.getResult();
      } else {
        this.logger.warn('User-Agent header not found');
        ua = undefined;
      }

      const request = <Request>{
        headers: req.headers || {},
        method: req.method || '',
        url: req.url || '/',
        host: req.headers.host || '',
        userAgent: <UserAgent>{
          architecture: (ua && ua.cpu && ua.cpu.architecture) || '',
          browser: (ua && ua.browser && ua.browser.name) || '',
          name: (ua && ua.os && ua.os.name) || '',
          version: (ua && ua.os && ua.os.version) || '',
          os: (ua && ua.engine && ua.engine.name) || '',
        },
        body: '',
      }

      this.onUpgrade(req, socket, head, request);
    });
  }

  override close(): void {
    this.running = false;

    this.server.close();
  }

  override listen(port: number, host: string): void {
    if (this.running) {
      this.logger.warn('Server is already running, ignoring request to start');
      return;
    }

    this.running = true;

    this.server.listen(port, host);
  }

  override onError(callback: (error: Error) => void): void {
    this.server.on('error', callback);
  }

  override onRequest(request: Request, response: Response): void {
    this._server.invoke(request.url, request, response);
  }

  override onUpgrade(request: any, socket: any, head: any, httpRequest: Request): void {
    this._server.upgrade(request, socket, head, httpRequest);
  }
}