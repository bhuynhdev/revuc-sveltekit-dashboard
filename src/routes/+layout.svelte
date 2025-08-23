<script lang="ts">
  import '../app.css'
  import favicon from '$lib/assets/favicon.svg'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<svelte:boundary>
  {@render children?.()}

  {#snippet pending()}
    <p>loading...</p>
  {/snippet}
</svelte:boundary>
