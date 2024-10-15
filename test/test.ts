import { Methods, Server, loggingHook } from '../lib';
import { open } from 'fs/promises';

const server = new Server({
  host: 'localhost',
  port: 8080,
  resources: 'test/resources'
});

server.addHook(loggingHook);

server.add({
  path: '/',
  method: Methods.GET,
  callback: async (req, res) => {
    res.sendFile('test/index.html', 'text/html');
  }
});

server.add({
  path: '/',
  method: Methods.POST,
  callback: async (req, res) => {
    console.log(req.body);

    res.send('!World Hello');
  }
});

server.add({
  path: '/:id/:name',
  method: Methods.GET,
  callback: async (req, res) => {
    res.send(`Hello ${req.params.id}/${req.params.name}`);
  }
});

server.addWs({
  path: '/ws',
  opened(request, response) {
    server.logger.info('WebSocket opened');
    response.send('Hello from WebSocket');
  },
  message(request, response, message) {
    server.logger.info(`WebSocket message: ${message}`);
    response.send(`You said: ${message}`);
  },
  closing(request) {
    server.logger.info('WebSocket closed');
  },
});

server.add({
  path: '/user/:name',
  method: Methods.GET,
  callback: async (req, res) => {
    res.send(`Hello user/${req.params.name}`);
  }
})

server.start();
