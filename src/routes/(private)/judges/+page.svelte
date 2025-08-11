<script lang="ts">
  import type { Judge } from '$lib/server/db/types'
  import IconTablerStack2 from '~icons/tabler/stack-2'
  import IconTablerTrashX from '~icons/tabler/trash-x'
  import type { PageProps } from './$types'
  import JudgeGroupListing from './JudgeGroupListing.svelte'

  const { data }: PageProps = $props()

  let newJudgeGroupChosenCategoryId = $state(1)
  const suggestedGroupName = $derived(generateNewJudgeGroupName(newJudgeGroupChosenCategoryId))

  /**
   * Helper function to generate group name when creating new group
   * Given a categoryId, generate a suggested name based on the Judge Group name convention
   */
  function generateNewJudgeGroupName(categoryId: number) {
    if (!newJudgeGroupChosenCategoryId || data.judgeGroups.length === 0) return ''

    // Judge Group name convention (see `resetAndOrganizeJudgeGroups` action):
    // - First char is categoryId converted to ASCII (1 -> A, 2 -> B, etc.)
    // - Second char is the ordering of this group within the category (1st group of cateogyId 1 -> A1, etc.)
    // So we just need to count how many groups are already in current category to be able to derive a next name
    const groupCountOfThisCategory = data.judgeGroups.filter((g) => g.categoryId === newJudgeGroupChosenCategoryId).length

    const firstChar = String.fromCharCode(64 + categoryId)
    const secondChar = (groupCountOfThisCategory + 1).toString()
    return `${firstChar}${secondChar}`
  }
</script>

<div class="flex items-end gap-10">
  <div>
    <h2>Judges</h2>
  </div>
  <div class="flex gap-4">
    <!-- <AddJudgesButtonAndModal /> -->
    <form action="?/organizeJudgeGroup" method="post">
      <button type="submit" class="btn btn-primary btn-outline w-fit">
        <span aria-hidden={true}>
          <IconTablerStack2 />
        </span>
        {data.judgeGroups.length ? 'Re-generate judge groups' : 'Generate judge groups'}
      </button>
    </form>
    <form action="?/clearJudgeGroups" method="post" hidden={!data.judgeGroups.length}>
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
  <h3 class="my-4 font-semibold">Judge Groups ({data.judgeGroups.length})</h3>
  <JudgeGroupListing judgeGroups={data.judgeGroups} {createJudgeGroupForm} {moveJudgeForm} />
</div>
<h3 class="my-6 font-semibold">Judge List ({data.judges.length})</h3>
<!-- <JudgeList judges={data.judges} /> -->

{#snippet createJudgeGroupForm()}
  <form method="post" action="/judges?/create-group">
    <label class="fieldset">
      <span class="fieldset-legend text-sm">Name</span>
      <input class="input" name="name" placeholder="B1" value={suggestedGroupName} required />
      <p class="label">Suggested group name: {suggestedGroupName}</p>
    </label>

    <label class="fieldset">
      <span class="fieldset-legend text-sm">Category</span>
      <select name="categoryId" class="select w-full" required bind:value={newJudgeGroupChosenCategoryId}>
        {#each data.categories as category, i}
          <option value={category.id} selected={i === 0}>
            {category.name}
          </option>
        {/each}
      </select>
    </label>

    <button type="submit" class="btn btn-primary mt-2 ml-auto block text-white"> Submit </button>
  </form>
{/snippet}

{#snippet moveJudgeForm(judgeToMove: Judge)}
  {@const currentGroup = data.judgeGroups.filter((g) => g.id === judgeToMove.judgeGroupId)[0]}
  {@const applicableJudgeGroups = data.judgeGroups.filter((g) => g.categoryId === judgeToMove.categoryId && g.id !== judgeToMove.judgeGroupId)}

  <p>
    Current group: {currentGroup.name} - {currentGroup.category.name}
  </p>
  {#if applicableJudgeGroups.length}
    <form method="post" action="?/moveJudge">
      <input type="hidden" name="judgeId" value={judgeToMove.id} />
      <label class="fieldset">
        <span class="fieldset-legend text-sm">New group</span>
        <select name="newGroupId" class="select w-full" required>
          {#each applicableJudgeGroups as group, i}
            <option value={group.id} selected={i === 0}>
              {group.name} - {group.category.name}
            </option>
          {/each}
        </select>
      </label>
      <button type="submit" class="btn btn-primary mt-2 ml-auto block text-white">
        Submit
      </button>
    </form>
  {:else}
    <p>No applicable groups to move to. Consider creating new groups</p>
  {/if}
{/snippet}
