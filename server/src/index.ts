import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import ndjson from 'ndjson';
import axios from 'axios';
import { catchError, defer, first, forkJoin, from, fromEventPattern, iif, interval, lastValueFrom, map, merge, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { PassThrough } from 'stream';

const app = new Elysia()
    .use(cors())
    .get('/', () => 'Hello Elysia')
    .get('/limit', ({ set }) => {
        const stream = ndjson.stringify();
        // const stream = new PassThrough();
        stream.on('close', () => {
            console.log('Stream closed');
        });

        try {
            set.headers['Content-Type'] = 'application/x-ndjson';

            console.log('Start processing /limit request');
            const axiosInstance = axios.create({
                baseURL: 'http://localhost:4001',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const computeQuota$ = from(
                axiosInstance.get<{
                    compute: number;
                    maxInstances: number;
                    memory: number;
                    maxMemory: number;
                    maxStorage?: number;
                    maxBandwidth?: number;
                }>('/compute-quota')
            );
            const storageUsage$ = from(axiosInstance.get<number>('/storage-usage'));
            const bandwidthUsage$ = from(axiosInstance.get<number>('/bandwidth-usage'));
            const defatultComputeQuota$ = defer(() => from(
              axiosInstance.get<{
                  maxInstances: number;
                  maxMemory: number;
                  maxStorage: number;
                  maxBandwidth: number;
              }>('/default-compute-quota')
            )).pipe(
              shareReplay()
            );

            const compute$ = computeQuota$.pipe(
                map((res) => ({ name: 'compute', usage: res.data.compute, limit: res.data.maxInstances })),
                catchError((err) => {
                    return of();
                })
            );
            const memory$ = computeQuota$.pipe(
                map((res) => ({ name: 'memory', usage: res.data.memory, limit: res.data.maxMemory })),
                catchError((err) => {
                    return of();
                })
            );
            const storage$ = forkJoin([
                computeQuota$.pipe(
                    switchMap((res) => iif(() => res.data.maxStorage === undefined, defatultComputeQuota$, of(res)))
                ),
                storageUsage$,
            ]).pipe(
                map(([quotaRes, usageRes]) => ({
                    name: 'storage',
                    usage: usageRes.data,
                    limit: quotaRes.data.maxStorage,
                })),
                catchError((err) => {
                    return of();
                })
            );
            const bandwidth$ = forkJoin([
                computeQuota$.pipe(
                    switchMap((res) => iif(() => res.data.maxBandwidth === undefined, defatultComputeQuota$, of(res)))
                ),
                bandwidthUsage$,
            ]).pipe(
                map(([quotaRes, usageRes]) => ({
                    name: 'bandwidth',
                    usage: usageRes.data,
                    limit: quotaRes.data.maxBandwidth,
                })),
                tap(() => {
                    console.log('bandwidth$ completed');
                }),
                catchError((err) => {
                    return of();
                })
            );

            merge(storage$, bandwidth$, compute$, memory$)
                .pipe(
                    map((limit) => {
                        stream.write(limit);
                    })
                )
                .subscribe({
                    error: (err) => {
                        console.log('Error in /limit processing:', err);
                        stream.end();
                    },
                    complete: () => {
                        console.log('Completed processing /limit request');
                        stream.end();
                    },
                });

            return stream;
        } catch (error) {
            console.error('Unexpected error in /limit:', error);
        }
    })
    .listen(4000);
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
