import { Server, loggingHook } from '../dist';

const server = new Server({
  host: 'localhost',
  port: 8080,
});

server.addHook(loggingHook);

server.addHook({
  name: 'testHook',
  before: async (req, res) => {
    console.log('Before hook');
  },
});

server.add({
  path: '/',
  method: 'GET',
  callback: async (req, res) => {
    res.send('Hello World');
  }
})

server.start();
