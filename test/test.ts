import { Hook, Methods, Server, loggingHook } from '../lib';

const server = new Server({
  host: 'localhost',
  port: 8080,
  resources: 'test/resources',
  debug: true,
});

const someHook: Hook = {
  name: 'SomeAuthHook',
  before(request, response, server) {
    if (request.body["token"] !== 'hallo') {
      return;
    }

    response.setStatusCode(401);
    response.sendJSON({
      message: 'Unauthorized',
    }); 

    return true;
  },
}

server.addHook(loggingHook);
server.addHook(someHook);

// Get request
server.add({
  path: '/',
  method: Methods.GET,
  callback: async (req, res) => {
    res.sendFile('test/index.html', 'text/html');
  }
});

// Post request
server.add({
  path: '/',
  method: Methods.POST,
  callback: async (req, res) => {
    console.log(req.body);

    res.send('!World Hello');
  }
});

// Dynamic path
server.add({
  path: '/:id/:name',
  method: Methods.GET,
  callback: async (req, res) => {
    res.send(`Hello ${req.params.id}/${req.params.name}`);
  }
});

// Cancel the request
server.add({
  path: '/secure',
  method: Methods.GET,
  callback: async (req, res) => {
    res.sendJSON({
      'msg': 'Success'
    });
  },
})

// WebSocket
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

server.start();
