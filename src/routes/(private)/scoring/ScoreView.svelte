<script lang="ts">
  import type { EvaluationWithSubmissionAndProject } from '$lib/server/db/types'
  import { mean } from 'simple-statistics'
  import { calculateZScoresByProject } from './scoring-util'

  type RawScoreViewProps = {
    evaluations: EvaluationWithSubmissionAndProject[]
  }

  let { evaluations }: RawScoreViewProps = $props()
  const evaluationsWithZScoreByProject = $derived(calculateZScoresByProject(evaluations))
</script>

<table class="table table-auto">
  <thead>
    <tr class="font-bold">
      <th>Project</th>
      <th>Score 1</th>
      <th>Score 2</th>
      <th>Score 3</th>
      <th>Z-score 1</th>
      <th>Z-score 2</th>
      <th>Z-score 3</th>
    </tr>
  </thead>
  <tbody>
    {#each evaluationsWithZScoreByProject.entries() as [_projectId, evaluations]}
      {@const project = evaluations[0].submission.project}
      <tr>
        <td>{project.name}</td>
        <td>{@render scoreNumbersWithFrequencies(evaluations.map((e) => e.score1) || [])}</td>
        <td>{@render scoreNumbersWithFrequencies(evaluations.map((e) => e.score2) || [])}</td>
        <td>{@render scoreNumbersWithFrequencies(evaluations.map((e) => e.score3) || [])}</td>
        <td>{@render zScoreList(evaluations.map((e) => e.zScore1))}</td>
        <td>{@render zScoreList(evaluations.map((e) => e.zScore2))}</td>
        <td>{@render zScoreList(evaluations.map((e) => e.zScore3))}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#snippet scoreNumbersWithFrequencies(scores: number[])}
  {@const freqMap = scores.reduce((map, score) => map.set(score, (map.get(score) || 0) + 1), new Map<number, number>())}
  <div class="flex gap-1.5">
    {#each [...freqMap.entries()].sort((a, b) => b[0] - a[0]) as [score, count]}
      <span class="relative">
        <span class="text-lg font-bold">{score}</span>
        <span class="text-xs text-gray-500 align-sub">{count}</span>
      </span>
    {/each}
  </div>
{/snippet}

{#snippet zScoreList(zScores: number[])}
  {@const cleanedZScores = zScores.filter((n) => !Number.isNaN(n))}
  <span>{cleanedZScores.map((n) => n.toFixed(3)).join(' ')}</span>
  {#if cleanedZScores.length}
    {@const meanZScore = mean(cleanedZScores).toFixed(3)}
    <span class="font-bold">&nbsp;({meanZScore})</span>
  {/if}
{/snippet}
