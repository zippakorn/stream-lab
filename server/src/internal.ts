import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const app = new Elysia()
  .use(cors())
  .get('/', () => 'Hello Internal Service')
  .get('/compute-quota', async ({ set }) => {
    console.log('Received request for /compute-quota');
    console.time('compute-quota');
    set.headers['Content-Type'] = 'application/json';
    const res =  {
      compute: 4,
      maxInstances: 10,
      memory: 1024,
      maxMemory: 2048,
      maxStorage: undefined,
      maxBandwidth: undefined,
    };

    await sleep(2000); // Simulate delay

    console.timeEnd('compute-quota');

    return res;
  })
  .get('/default-compute-quota', async ({ set }) => {
    console.log('Received request for /default-compute-quota');
    console.time('default-compute-quota');
    set.headers['Content-Type'] = 'application/json';
    const res =  {
      maxInstances: 1,
      maxMemory: 2048,
      maxStorage: 100,
      maxBandwidth: 100,
    };

    await sleep(3000); // Simulate delay

    console.timeEnd('default-compute-quota');

    return res;
  })
  .get('/storage-usage', async ({ set }) => {
    console.log('Received request for /storage-usage');
    console.time('storage-usage');
    set.headers['Content-Type'] = 'application/json';

    await sleep(5000); // Simulate delay

    console.timeEnd('storage-usage');

    return 10;
  })
  .get('/bandwidth-usage', async ({ set }) => {
    console.log('Received request for /bandwidth-usage');
    console.time('bandwidth-usage');
    set.headers['Content-Type'] = 'application/json';

    await sleep(3000); // Simulate delay

    console.timeEnd('bandwidth-usage');

    return 200;
  })
  .listen(4001);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
