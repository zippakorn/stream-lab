<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { SomeService, type Limit } from '$lib/some-service';
	import { onMount } from 'svelte';

	type LimitPlaceholder = {
		name: string;
		limit: Limit | null;
	};

	let { children } = $props();
	const resources = $state([
		{
			name: 'compute',
			limit: null
		},
		{
			name: 'memory',
			limit: null
		},
		{
			name: 'storage',
			limit: null
		},
		{
			name: 'bandwidth',
			limit: null
		}
	] as LimitPlaceholder[]);
	let isLoading = $state(true);

	onMount(() => {
		const limits$ = SomeService.getLimit();

		limits$.subscribe({
			next: (value) => {
				console.log('Next:', value);

				resources.find((r) => r.name === value.name)!.limit = value;
			},
			error: (err) => {
				console.error('Error:', err);
			},
			complete: () => {
				console.log('Completed');
				isLoading = false;
			}
		});
	});
</script>

<main class="container mx-auto p-6">
	<header class="mb-8">
		<h1 class="text-3xl font-extrabold text-gray-800">Resource Quota</h1>
		<p class="text-gray-600 mt-2">
			Monitor your resource usage and ensure you stay within your limits.
		</p>
	</header>

	<section>
		{#if resources.length > 0}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each resources as resource, index}
					<div class="p-4 border rounded-lg shadow-sm bg-white">
						{#if isLoading && resource.limit === null}
							<!-- Skeleton Loader -->
							<div class="animate-pulse">
								<div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
								<div class="h-4 bg-gray-300 rounded w-1/2"></div>
								<div class="h-6 bg-gray-200 rounded mt-4"></div>
							</div>
						{:else if !isLoading && resource.limit === null}
							<!-- Error UI -->
							<div class="text-red-500 text-center">
								<p class="font-bold">Error Loading Resource</p>
								<p class="text-sm">Unable to fetch the limit for {resource.name}.</p>
							</div>
						{:else}
							<!-- Resource Content -->
							<Label class="flex justify-between text-lg font-medium text-gray-700">
								{resource.name}
								<span class="text-sm text-gray-500"
									>{resource.limit?.usage ?? 0} / {resource.limit?.limit ?? 'N/A'}</span
								>
							</Label>
							<Progress
								value={resource.limit?.usage ?? 0}
								max={resource.limit?.limit ?? 100}
								class="w-full mt-2"
							/>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-gray-500">No resource limits available at the moment.</p>
		{/if}
	</section>
</main>
