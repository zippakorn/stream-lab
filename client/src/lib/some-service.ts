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
	let dataBuffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				dataBuffer = dataBuffer.trim();

				if (dataBuffer.length > 0) {
					try {
						const dataLine = JSON.parse(dataBuffer);
						yield dataLine as T;
					} catch (err) {}
				}

				return;
			}

			let data = new TextDecoder().decode(value, { stream: true });
			dataBuffer += data;

			console.log('Received chunk:', data);

			const lines = dataBuffer.split('\n');

			for (const line of lines) {
				const l = line.trim();

				if (l.length === 0) {
					continue;
				}

				try {
					const dataLine = JSON.parse(l);
					yield dataLine as T;
				} catch (err) {
					break;
				}
			}

			dataBuffer = lines[lines.length - 1];
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
			baseURL: 'http://localhost:4000',
			headers: {
				'Content-Type': 'application/json'
			},
			responseType: 'stream',
			adapter: 'fetch'
		});
		axiosInstance.interceptors.response.use((response) => {
			console.log('Received response', response, response.headers['content-type']);
			if (
				response.config.responseType === 'stream' &&
				response.headers['content-type'] === 'application/x-ndjson' &&
				response.data instanceof ReadableStream
			) {
				response.data = streamAsyncJSONIterator<any>(response.data);
				console.log('Response data is a ReadableStream, converted to AsyncIterator', response);

				return response;
			}

			return response;
		});
		const { data } = await axiosInstance.get<any>('/limit');
		console.log('Received response from /limit', data);
		for await (const value of data) {
			o.next(value as any);
		}

		o.complete();
	});
}

export const SomeService = {
	getLimit
};
