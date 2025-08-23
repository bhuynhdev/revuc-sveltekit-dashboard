<script lang="ts">
  import type { Judge } from '$lib/server/db/types'
  import IconTablerHomeMove from '~icons/tabler/home-move'
  import IconTablerTrash from '~icons/tabler/trash'
  import IconTablerX from '~icons/tabler/x'
  import { listCategories } from '../categories/categories.remote'
  import { listJudgeGroups } from './judges.remote'

  const judgeGroups = listJudgeGroups()

  let judgeToMove = $state<Judge | null>(null)
  let newJudgeGroupChosenCategoryId = $state(1)

  let moveJudgeModal: HTMLDialogElement
  let createJudgeGroupModal: HTMLDialogElement

  const suggestedGroupName = $derived.by(() => {
    /**
    * Generate group name suggestion when creating new group
    * Given an input categoryId, generate a suggested name based on the Judge Group name convention
    */
    const categoryId = newJudgeGroupChosenCategoryId
    if (!categoryId || !judgeGroups.current || judgeGroups.current.length === 0) return ''

    // Judge Group name convention (see `resetAndOrganizeJudgeGroups` remote command):
    // - First char is categoryId converted to ASCII (1 -> A, 2 -> B, etc.)
    // - Second char is the ordering of this group within the category (1st group of cateogyId 1 -> A1, etc.)
    // So we just need to count how many groups are already in current category to be able to derive a next name
    const groupCountOfThisCategory = judgeGroups.current.filter((g) => g.categoryId === categoryId).length

    const firstChar = String.fromCharCode(64 + categoryId)
    const secondChar = (groupCountOfThisCategory + 1).toString()
    return `${firstChar}${secondChar}`
  })

</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-6">
  {#each await judgeGroups as group}
    <div class="relative h-72 rounded-xl border border-gray-400 p-4 shadow">
      <p class="ml-2 text-lg font-bold">Group {group.name}</p>
      <p class="my-1 ml-2 text-sm text-gray-600 italic">{group.category.name}</p>

      {#if group.judges.length === 0}
        <form method="post" action="?/delete" class="tooltip absolute top-4 right-4" data-tip={`Delete empty group ${group.name}`}>
          <input type="hidden" name="groupId" value={group.id} />
          <button type="submit" class="cursor-pointer" aria-label={`Delete empty group ${group.name}`}>
            <IconTablerTrash width={24} height={24} />
          </button>
        </form>
      {/if}

      <div class="mt-2 flex flex-col">
        {#each group.judges as j}
          <div class="group/judge flex items-center justify-between px-2 py-1 hover:bg-slate-100">
            <p>{j.name}</p>
            <button
              class="cursor-pointer opacity-0 group-hover/judge:opacity-100"
              aria-label={`Move judge ${j.name} to another group`}
              onclick={() => {
                judgeToMove = j
                moveJudgeModal.show()
              }}
            >
              <IconTablerHomeMove />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  <div class="h-72 rounded-xl border border-dashed border-gray-400 shadow">
    <button type="button" class="h-full w-full cursor-pointer" onclick={() => createJudgeGroupModal.showModal()}> New group </button>
  </div>

  <dialog id="create-judge-group-modal" class="modal" bind:this={createJudgeGroupModal}>
    <div class="modal-box h-[400px] max-w-md lg:max-w-lg">
      <div class="flex justify-between">
        <h3 class="mb-4 text-lg font-bold">New Judge Group</h3>
        <button class="cursor-pointer" aria-label="Close" onclick={() => createJudgeGroupModal.close()}>
          <IconTablerX />
        </button>
      </div>
      {@render createJudgeGroupForm()}
      <form method="dialog" class="modal-action">
        <button class="btn">Close</button>
      </form>
    </div>
  </dialog>

  <dialog id="move-judge-modal" class="modal" bind:this={moveJudgeModal}>
    <div class="modal-box h-[320px] max-w-md lg:max-w-lg">
      <div class="flex justify-between">
        <h3 class="mb-4 text-lg font-bold">
          Move Judge {judgeToMove?.name}
        </h3>
        <button class="cursor-pointer" aria-label="Close" onclick={() => moveJudgeModal.close()}>
          <IconTablerX />
        </button>
      </div>
      {#if judgeToMove}
        {@render moveJudgeForm(judgeToMove)}
      {/if}
      <form method="dialog" class="modal-action">
        <button class="btn">Close</button>
      </form>
    </div>
  </dialog>
</div>

{#snippet createJudgeGroupForm()}
  <form method="post" action="/judges?/create-group">
    <label class="fieldset">
      <span class="fieldset-legend text-sm">Name</span>
      <input class="input" name="name" placeholder={suggestedGroupName} value={suggestedGroupName} required />
      <p class="label">Suggested group name: {suggestedGroupName}</p>
    </label>

    <label class="fieldset">
      <span class="fieldset-legend text-sm">Category</span>
      <select name="categoryId" class="select w-full" required bind:value={newJudgeGroupChosenCategoryId}>
        {#each await listCategories() as category, i}
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
  {#if judgeGroups.current}
    {@const currentGroup = judgeGroups.current.filter((g) => g.id === judgeToMove.judgeGroupId)[0]}
    {@const applicableJudgeGroups = judgeGroups.current.filter((g) => g.categoryId === judgeToMove.categoryId && g.id !== judgeToMove.judgeGroupId)}

    <p>
      Current group: {currentGroup?.name} - {currentGroup?.category.name}
    </p>
    {#if applicableJudgeGroups?.length}
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
        <button type="submit" class="btn btn-primary mt-2 ml-auto block text-white"> Submit </button>
      </form>
    {:else}
      <p>No applicable groups to move to. Consider creating new groups</p>
    {/if}
  {/if}
{/snippet}
