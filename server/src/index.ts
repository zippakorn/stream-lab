import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { PassThrough } from 'stream';

const app = new Elysia()
  .use(cors())
  .get('/', () => 'Hello Elysia')
  .get('/limit', ({ set }) => {
    const stream = new PassThrough();

    set.headers['Content-Type'] = 'application/octet-stream';

    setImmediate(() => {
      console.log('setImmediate callback');
      stream.write('hello\n');
      stream.end();
    });

    return stream;
  })
  .listen(3000);
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
