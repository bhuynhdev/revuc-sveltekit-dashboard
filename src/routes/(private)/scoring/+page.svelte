<script lang="ts">
  import type { Evaluation, Project } from '$lib/server/db/types'
  import { listEvaluations, startEvaluations } from './scoring.remote'

  const evaluations = listEvaluations()

  let chosenCategoryId = $state<number | null>(null)

  type EvaluationDto = NonNullable<typeof evaluations.current>[number]

  const scoresByProjects = $derived.by(() => {
    let map = new Map<Project['id'], Array<EvaluationDto>>()
    for (const e of evaluations.current || []) {
      const projectId = e.submission.projectId
      if (!map.get(projectId)) {
        map.set(projectId, [])
      }
      map.get(projectId)?.push(e)
    }
    // Convert map to array
    const result = [...map.entries()].map(([_projectId, evaluations]) => {
      if (evaluations.length === 0) {
        return null // Should never really have a project without evaluations, but returns null just to be safe
      }

      const project = evaluations[0].submission.project

      // Strip the submission field from each evaluation
      const cleanedEvaluations = evaluations.map(({ submission, ...rest }) => rest)

      return {
        project,
        evaluations: cleanedEvaluations
      }
    })
    return result
  })
</script>

<div>
  {#if evaluations.current?.length}
    <p>Juding has started</p>
  {:else}
    <form {...startEvaluations}>
      <button class="btn btn-primary" type="submit">Start evaluations</button>
    </form>
  {/if}
  <table class="table table-auto">
    <thead>
      <tr class="font-bold">
        <th>Project</th>
        <th>Score 1</th>
        <th>Score 2</th>
        <th>Score 3</th>
      </tr>
    </thead>
    <tbody>
      {#each scoresByProjects as projectWithScore}
        <tr>
          <td>{projectWithScore?.project.name}</td>
          <td>{@render scoreNumbersWithFrequencies(projectWithScore?.evaluations.map((e) => e.score1) || [])}</td>
          <td>{@render scoreNumbersWithFrequencies(projectWithScore?.evaluations.map((e) => e.score2) || [])}</td>
          <td>{@render scoreNumbersWithFrequencies(projectWithScore?.evaluations.map((e) => e.score3) || [])}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#snippet scoreNumbersWithFrequencies(scores: number[])}
  {@const freqMap = scores.reduce((map, score) => map.set(score, (map.get(score) || 0) + 1), new Map<number, number>())}
  <div class='flex gap-1.5'>
    {#each [...freqMap.entries()] as [score, count]}
      <span class="relative">
        <span class="text-lg font-bold">{score}</span>
        <span class="text-xs text-gray-500 align-sub">{count}</span>
      </span>
    {/each}
  </div>
{/snippet}
