import { Server, loggingHook } from '../lib';

const server = new Server({
  host: 'localhost',
  port: 8080,
});

server.addHook(loggingHook);

server.add({
  path: '/',
  method: 'GET',
  callback: async (req, res) => {
    res.send('Hello World');
  }
})

server.start();
