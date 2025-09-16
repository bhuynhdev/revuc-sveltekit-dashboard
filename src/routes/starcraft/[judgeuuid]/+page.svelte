<script lang="ts">
  import { type Evaluation, type SubmissionWithEvaluation } from '$lib/server/db/types'
  import IconTablerMapPin from '~icons/tabler/map-pin'
  import type { PageProps } from './$types'
  import { getJudgeByUuid, updateEvaluation } from './starcraft.remote'

  const { params }: PageProps = $props()

  const judge = $derived(getJudgeByUuid(params.judgeuuid))
  // Judging has started if evalation records have been created
  const judgingHasStarted = $derived(!!judge.current?.assignedSubmissions.some((s) => s.evaluation))
</script>

{#if judge.current}
  {@const j = judge.current}

  {#if j.group}
    <p>Hello {j.name} - Group: {j.group.name}</p>
    <p><span class="italic">{j.category.name}</span> - {j.assignedSubmissions?.length || 0} projects</p>
  {:else}
    <p>No group assigned yet</p>
  {/if}
  {#if !judgingHasStarted}
    <p>Judging has not started</p>
  {/if}

  {#if j.assignedSubmissions}
    <div class="flex p-2 gap-2 flex-wrap justify-center">
      {#each j.assignedSubmissions as submission, i}
        {@render submissionView(submission, i)}
      {/each}
    </div>
  {/if}
{/if}

{#snippet submissionView(submission: SubmissionWithEvaluation, listIndex: number)}
  {@const project = submission.project}
  <div class="p-3 outline-1 w-full max-w-lg">
    <p>
      {listIndex + 1}. {project.name} | <IconTablerMapPin class="inline" />
      {project.location}
    </p>
    <a href={project.url} target="_blank" class="link">Devpost</a>
    {#if submission.evaluation}
      {@render scoringForm(submission.evaluation)}
    {:else}
      <div>Can't give score yet</div>
    {/if}
  </div>
{/snippet}

{#snippet scoringForm(evaluation: Evaluation)}
  <form {...updateEvaluation}>
    <input type="hidden" name="judgeId" value={evaluation.judgeId} />
    <input type="hidden" name="submissionId" value={evaluation.submissionId} />
    <input type="hidden" name="judgeUuid" value={params.judgeuuid} />
    {#each [1, 2, 3] as const as idx}
      <fieldset class="flex items-center gap-2">
        <legend class="w-20 font-medium sr-only">Score {idx}</legend>
        <label class="w-20 font-medium" for="score{idx}-{evaluation.submissionId}">Score {idx}</label>
        <div class="flex flex-row-reverse gap-1">
          {#each [5, 4, 3, 2, 1] as star}
            <input
              type="radio"
              id="score{idx}-{evaluation.submissionId}-{star}"
              name="score{idx}"
              value={star}
              checked={evaluation[`score${idx}`] === star}
              class="hidden peer"
              onchange={(e) => e.currentTarget.form!.requestSubmit()}
            />
            <label for="score{idx}-{evaluation.submissionId}-{star}" class="cursor-pointer text-2xl text-gray-300 peer-checked:text-yellow-400">
              ★
            </label>
          {/each}
        </div>
      </fieldset>
    {/each}
  </form>
{/snippet}
