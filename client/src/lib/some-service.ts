import axios from 'axios';
import { Observable } from './observable';

async function* streamAsyncIterator<T>(stream: ReadableStream<T>) {
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

function getLimit(): Observable<string> {
	return new Observable<string>(async (o) => {
		const axiosInstance = axios.create({
			baseURL: 'http://localhost:3000',
			headers: {
				'Content-Type': 'application/json'
			},
			responseType: 'stream',
			adapter: 'fetch'
		});
		const { data } = await axiosInstance.get<ReadableStream<Uint8Array>>('/limit');

    for await (const chunk of streamAsyncIterator(data)) {
      o.next(new TextDecoder().decode(chunk));
    }

		o.complete();
	});
}

export const SomeService = {
	getLimit
};
