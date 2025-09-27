<script lang="ts">
  import ScoreView from './ScoreView.svelte'
  import { listEvaluations, startEvaluations } from './scoring.remote'

  const evaluations = listEvaluations()

  const scoreViewTypess = ['rawscore', 'zscore'] as const
  type ScoreViewType = typeof scoreViewTypess[number]
  let chosenScoreViewType = $state<ScoreViewType>('rawscore')

</script>

<div>
  {#if evaluations.current?.length}
    <p>Juding has started</p>
  {:else}
    <form {...startEvaluations}>
      <button class="btn btn-primary" type="submit">Start evaluations</button>
    </form>
  {/if}
  <select class="select" oninput={e => chosenScoreViewType = e.currentTarget.value as ScoreViewType}>
    {#each scoreViewTypess as viewType}
      <option value={viewType}>{viewType}</option>
    {/each}
  </select>
  {#if chosenScoreViewType === 'rawscore'}
    <ScoreView evaluations={evaluations.current || []} />
  {/if}
</div>
