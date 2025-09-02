<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link href="/src/app.css" rel="stylesheet">
</svelte:head>

{@render children?.()}
