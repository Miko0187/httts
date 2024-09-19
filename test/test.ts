import { Methods, Server, loggingHook } from '../lib';

const server = new Server({
  host: 'localhost',
  port: 8080,
});

server.addHook(loggingHook);

server.add({
  path: '/',
  method: Methods.GET,
  callback: async (req, res) => {
    res.send('Hello World');
  }
})

server.start();
