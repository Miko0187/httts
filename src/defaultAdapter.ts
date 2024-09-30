import http from 'http';
import { Adapter, Request, Response, UserAgent } from "./adapter";
import { UAParser, IResult } from "ua-parser-js";
import { open } from 'fs';
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
          headers: req.headers,
          method: req.method,
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
  
        const response = <Response>{
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
            res.write(body);
          },
          sendCustom(body, type) {
            res.setHeader('Content-Type', type);
            res.write(body);
          },
          sendFile(path, type) {
            const file = open(path, 'r', (err, fd) => {
              if (err) {
                res.statusCode = 500;
                res.write('Internal server error');
                res.end();

                this.logger.error(`Error opening file: ${err.message}`);
                return;
              }
  
              res.setHeader('Content-Type', type);
              res.write(fd);
        
              res.end();
            });
          },
          sendJSON(body) {
            if (!res.getHeader('Content-Type')) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.write(JSON.stringify(body));
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
        }
  
        _this.onRequest(request, response);
      });
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
}