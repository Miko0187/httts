import { Methods, Server, loggingHook } from '../lib';
import { open } from 'fs/promises';

const server = new Server({
  host: 'localhost',
  port: 8080,
});

server.addHook(loggingHook);

server.add({
  path: '/',
  method: Methods.GET,
  callback: async (req, res) => {
    const file = await open('test/index.html', 'r');

    res.setHeader('Content-Type', 'text/html');
    res.send(await file.readFile({ encoding: 'utf-8' }));

    await file.close();
    res.close();
  }
});

server.add({
  path: '/',
  method: Methods.POST,
  callback: async (req, res) => {
    console.log(req.body);

    res.send('!World Hello');
    res.close();
  }
});


server.add({
  path: '/:id/:name',
  method: Methods.GET,
  callback: async (req, res) => {
    res.send(`Hello ${req.params.id}/${req.params.name}`);
    res.close();
  }
});

server.start();
