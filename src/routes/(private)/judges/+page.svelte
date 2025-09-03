<script lang="ts">
  import IconTablerStack2 from '~icons/tabler/stack-2'
  import IconTablerTrashX from '~icons/tabler/trash-x'
  import JudgeGroupListing from './JudgeGroupListing.svelte'
  import JudgeListing from './JudgeListing.svelte'
  import { clearJudgeGroups, listJudgeGroups, resetAndOrganizeJudgeGroups } from './judge-groups.remote'
  import { listJudges } from './judges.remote'

  const judges = listJudges()
  const judgeGroups = listJudgeGroups()
</script>

<div class="flex items-end gap-10">
  <div>
    <h2>Judges</h2>
  </div>
  <div class="flex gap-4">
    <!-- <AddJudgesButtonAndModal /> -->
    <form {...resetAndOrganizeJudgeGroups}>
      <button type="submit" class="btn btn-primary btn-outline w-fit">
        <span aria-hidden={true}>
          <IconTablerStack2 />
        </span>
        {judgeGroups.current?.length ? 'Re-generate judge groups' : 'Generate judge groups'}
      </button>
    </form>
    <form {...clearJudgeGroups} hidden={!judgeGroups.current?.length}>
      <button type="submit" class="btn btn-error btn-outline w-fit">
        <span aria-hidden={true}>
          <IconTablerTrashX />
        </span>
        Delete all judge group
      </button>
    </form>
  </div>
</div>

<div>
  <h3 class="my-4 font-semibold">Judge Groups ({judgeGroups.current?.length})</h3>
  {#if judgeGroups.current?.length}
    <JudgeGroupListing />
  {/if}
</div>
<h3 class="my-6 font-semibold">Judge List ({judges.current?.length})</h3>
{#if judges.current?.length}
  <JudgeListing />
{/if}
