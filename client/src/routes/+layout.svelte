<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { SomeService } from '$lib/some-service';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		const observable$ = await SomeService.getLimit();

		observable$.subscribe({
			next: (value) => {
				console.log('Next:', value);
			},
			error: (err) => {
				console.error('Error:', err);
			},
			complete: () => {
				console.log('Completed');
			}
		});
		// const reader = data.getReader();
		// // const writableStream = new WritableStream()
		// // data.pipeTo(writableStream);

		// while (true) {
		// 	const { done, value } = await reader.read();
		// 	if (done) break;
		// 	console.log(new TextDecoder().decode(value));
		// }

		// console.log('Stream reading completed');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
