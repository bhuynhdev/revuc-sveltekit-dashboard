<script lang="ts">
  import type { Category } from '$lib/server/db/types'
  import { listCategories } from '../categories/categories.remote'
  import ScoreView from './ScoreView.svelte'
  import { listEvaluations, startEvaluations } from './scoring.remote'

  const evaluations = listEvaluations()
  let chosenCategoryId = $state<Category['id']>(1)
  const filteredEvaluations = $derived(
    (evaluations.current ?? []).filter(
      // Don't filter if chosenCategoryId is 1 (i.e. the General category), since all scores are used for General judging
      e => chosenCategoryId === 1 || e.submission.categoryId === chosenCategoryId
    )
  );
</script>

<div>
  {#if evaluations.current?.length}
    <p>Juding has started</p>
  {:else}
    <form {...startEvaluations}>
      <button class="btn btn-primary" type="submit">Start evaluations</button>
    </form>
  {/if}
  <select class="select" oninput={(e) => (chosenCategoryId = Number(e.currentTarget.value))}>
    {#each await listCategories() as category}
      <option value={category.id}>{category.name}</option>
    {/each}
  </select>
  <ScoreView evaluations={filteredEvaluations} />
</div>
