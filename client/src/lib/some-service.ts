import axios from 'axios';
import { Observable } from './observable';

async function* streamAsyncIterator<T>(stream: ReadableStream<T>): AsyncGenerator<T> {
	// Get a lock on the stream
	const reader = stream.getReader();

	try {
		while (true) {
			// Read from the stream
			const { done, value } = await reader.read();
			// Exit if we're done
			if (done) return;
			// Else yield the chunk
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}

async function* streamAsyncJSONIterator<T>(stream: ReadableStream<Uint8Array>): AsyncGenerator<T> {
	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				return;
			}

			const string = new TextDecoder().decode(value);
			const json = JSON.parse(string) as T;
			yield json;
		}
	} catch (err) {
		reader.cancel();
		throw err;
	} finally {
		reader.releaseLock();
	}
}

export interface Limit {
	name: string;
	usage: number;
	limit: number;
}

function getLimit(): Observable<Limit> {
	return new Observable<Limit>(async (o) => {
		const axiosInstance = axios.create({
			baseURL: 'http://localhost:3000',
			headers: {
				'Content-Type': 'application/json'
			},
			responseType: 'stream',
			adapter: 'fetch'
		});
		const { data } = await axiosInstance.get<ReadableStream<Uint8Array>>('/limit');
		for await (const value of streamAsyncJSONIterator<Limit>(data)) {
			o.next(value);
		}

		o.complete();
	});
}

export const SomeService = {
	getLimit
};
