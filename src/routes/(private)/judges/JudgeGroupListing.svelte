<script lang="ts">
  import type { Judge, JudgeGroupWithJudges } from '$lib/server/db/types'
  import type { Snippet } from 'svelte'
  import IconTablerHomeMove from '~icons/tabler/home-move'
  import IconTablerTrash from '~icons/tabler/trash'
  import IconTablerX from '~icons/tabler/x'

  type JudgeGroupListingProps = {
    judgeGroups: JudgeGroupWithJudges[],
    createJudgeGroupForm: Snippet,
    moveJudgeForm: Snippet<[Judge]>
  }

  const { judgeGroups, createJudgeGroupForm: judgeGroupCreateForm, moveJudgeForm }: JudgeGroupListingProps = $props()

  let judgeToMove = $state<Judge | null>()
  let moveJudgeModal: HTMLDialogElement
  let createJudgeGroupModal: HTMLDialogElement

</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-6">
  {#each judgeGroups as group}
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
      {@render judgeGroupCreateForm()}
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
