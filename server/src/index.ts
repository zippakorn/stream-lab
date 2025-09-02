import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import ndjson from 'ndjson';

const app = new Elysia()
  .use(cors())
  .get('/', () => 'Hello Elysia')
  .get('/limit', ({ set }) => {
    const stream = ndjson.stringify();
    set.headers['Content-Type'] = 'application/x-ndjson';

    setImmediate(() => {
      try {
        const resources = [
          { name: 'compute', usage: 2, limit: 10 },
          { name: 'memory', usage: 512, limit: 2048 },
          { name: 'storage', usage: 10, limit: 100 },
          { name: 'bandwidth', usage: 200, limit: 1000 },
        ];
        let count = 0

        resources.forEach((resource) => {
          const delay = Math.random() * 2000 + 500; // Random delay between 500ms and 2500ms
          setTimeout(() => {
            stream.write(resource);
            count++;

            if (count >= resources.length) {
              stream.end();
            }
          }, delay);
        });
      } catch (err) {
        stream.emit('error', err);
        stream.end();
      }
    });

    return stream;
  })
  .listen(3000);
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
