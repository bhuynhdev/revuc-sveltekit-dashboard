<script lang="ts">
  import { type Evaluation, type SubmissionWithEvaluation } from '$lib/server/db/types'
  import IconTablerMapPin from '~icons/tabler/map-pin'
  import IconDevpost from '~icons/simple-icons/devpost'
  import type { PageProps } from './$types'
  import { getJudgeByUuid, updateEvaluation } from './starcraft.remote'

  const { params }: PageProps = $props()

  const judge = $derived(getJudgeByUuid(params.judgeuuid))
  // Judging has started if evalation records have been created
  const judgingHasStarted = $derived(!!judge.current?.assignedSubmissions.some((s) => s.evaluation))

  let chosenSubmission = $state<SubmissionWithEvaluation | null>(null)
  let drawerState = {
    get checked() {
      return !!chosenSubmission
    },
    set checked(checked) {
      if (!checked) chosenSubmission = null
    }
  }
</script>

<div class="drawer">
  <input id="submission-details-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerState.checked} />
  <div class="drawer-content">
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
          {#each j.assignedSubmissions as submission, i (submission.id)}
            {@render submissionView(submission, i)}
          {/each}
        </div>
      {/if}
    {/if}
  </div>
  <div class="drawer-side">
    <label for="submission-details-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="min-h-full w-4/5 bg-base-200 p-2">
      <label for="submission-details-drawer" aria-label="close sidebar" class="btn btn-error">Close</label>
      {#if chosenSubmission}
        <h3 class="font-semibold text-lg">{chosenSubmission.project.name}</h3>
        <h4>Summary</h4>
        <p class="mb-2">lorem ipsum</p>
        {#if chosenSubmission.evaluation}
          {@render scoringForm(chosenSubmission.evaluation)}
        {/if}
      {:else}
        No project selected
      {/if}
    </div>
  </div>
</div>

{#snippet submissionView(submission: SubmissionWithEvaluation, listIndex: number)}
  {@const project = submission.project}
  <div class="p-3 outline-1 w-full max-w-lg">
    <div class="flex justify-between w-full gap-3 mb-2">
      <div class="flex gap-1.5 overflow-hidden whitespace-nowrap">
        <button class="drawer-button truncate" onclick={() => (chosenSubmission = submission)}>
          <span>{listIndex + 1}.</span>
          <span class="link">{project.name}</span>
        </button>
        <div class="flex-shrink-0 inline">
          <span>| <IconTablerMapPin class="inline" /> {project.location}</span>
        </div>
      </div>
      {#if project.url}
        <div class="flex-shrink-0 inline">
          <a href={project.url} target="_blank"><IconDevpost class="inline" width="28" height="28" /></a>
        </div>
      {/if}
    </div>
    {#if submission.evaluation}
      {@render scoringForm(submission.evaluation)}
    {:else}
      <div>Can't give score yet</div>
    {/if}
  </div>
{/snippet}

{#snippet scoringForm(evaluation: Evaluation)}
  <form {...updateEvaluation.enhance(async ({ submit }) => await submit())}>
    <input type="hidden" name="judgeId" value={evaluation.judgeId} />
    <input type="hidden" name="submissionId" value={evaluation.submissionId} />
    <input type="hidden" name="judgeUuid" value={params.judgeuuid} />
    <div class="space-y-2">
      {#each [1, 2, 3] as const as idx}
        <fieldset class="flex items-center gap-2">
          <legend class="font-medium sr-only">Score {idx}</legend>
          <label class="w-2/5 font-medium" for="score{idx}-{evaluation.submissionId}">Score {idx}</label>
          <div class="rating">
            {#each [1, 2, 3, 4, 5] as star}
              <input
                type="radio"
                id="score{idx}-{evaluation.submissionId}-{star}"
                name="score{idx}"
                aria-label={`${star} star`}
                value={star}
                checked={evaluation[`score${idx}`] === star}
                class="mask mask-star bg-yellow-400"
                onchange={(e) => e.currentTarget.form!.requestSubmit()}
              />
            {/each}
          </div>
        </fieldset>
      {/each}
      {#if judge.current?.category.name !== 'General'}
        <fieldset class="flex items-center gap-2">
          <legend class="w-40 font-medium sr-only">Category relevance</legend>
          <label class="w-40 font-medium" for="categoryScore-{evaluation.submissionId}">Category relevance</label>
          <div class="flex flex-row-reverse gap-1">
            {#each [5, 4, 3, 2, 1] as star}
              <input
                type="radio"
                id="categoryScore-{evaluation.submissionId}-{star}"
                name="categoryScore"
                value={star}
                checked={evaluation.categoryScore === star}
                class="hidden peer"
                onchange={(e) => e.currentTarget.form!.requestSubmit()}
              />
              <label for="categoryScore-{evaluation.submissionId}-{star}" class="cursor-pointer text-2xl text-gray-300 peer-checked:text-yellow-400">
                ★
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}
    </div>
  </form>
{/snippet}
