<script lang="ts">
  import IconTablerInfoCircle from '~icons/tabler/info-circle'
  import IconTablerPlus from '~icons/tabler/plus'
  import IconTablerStack2 from '~icons/tabler/stack-2'
  import IconTablerTrashX from '~icons/tabler/trash-x'
  import IconTablerX from '~icons/tabler/x'

  import { listCategories } from '../categories/categories.remote'
  import JudgeGroupListing from './JudgeGroupListing.svelte'
  import JudgeListing from './JudgeListing.svelte'
  import { clearJudgeGroups, listJudgeGroups, resetAndOrganizeJudgeGroups } from './judge-groups.remote'
  import { createJudge, createJudgesBulk, listJudges } from './judges.remote'

  const judges = listJudges()
  const judgeGroups = listJudgeGroups()

  let addJudgesModal!: HTMLDialogElement
  let bulkEntryFormRef: HTMLFormElement
</script>

<div class="flex items-end gap-10">
  <div>
    <h2>Judges</h2>
  </div>
  <div class="flex gap-4">
    {@render addJudgesButtonAndModal()}
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

{#snippet addJudgesButtonAndModal()}
  <button type="button" class="btn btn-primary btn-outline w-fit" onclick={() => addJudgesModal.showModal()}>
    <span aria-hidden="true">
      <IconTablerPlus />
    </span>
    Add judges
  </button>
  <dialog id="add-judges-modal" class="modal" bind:this={addJudgesModal}>
    <div class="modal-box h-[600px] max-w-md lg:max-w-lg">
      <div class="flex justify-between">
        <h3 class="mb-4 text-lg font-bold">Add Judges</h3>
        <button class="cursor-pointer" aria-label="Close" onclick={() => addJudgesModal.close()}>
          <IconTablerX />
        </button>
      </div>
      {@render judgeCreateForm()}
      <form method="dialog" class="modal-action">
        <button class="btn">Close</button>
      </form>
    </div>
  </dialog>
{/snippet}

{#snippet judgeCreateForm()}
  <div class="tabs tabs-lift">
    <input type="radio" name="add_judges_form_tab" class="tab" aria-label="Manual entry" checked />
    <div class="tab-content border-base-300 bg-base-100 p-5">
      <form {...createJudge} class="space-y-4">
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Judge Name</span>
          <input class="input" name="name" placeholder="John Doe" required />
        </div>
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Email</span>
          <input class="input" name="email" placeholder="best@education.com" type="email" required />
        </div>
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Category</span>
          <select class="select" name="categoryId">
            {#each await listCategories() as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
        </div>
        <button type="submit" class="btn btn-primary ml-auto block"> Submit </button>
      </form>
    </div>

    <input type="radio" name="add_judges_form_tab" class="tab" aria-label="Bulk entry" />
    <div class="tab-content border-base-300 bg-base-100 p-5">
      <form {...createJudgesBulk} class="space-y-3" enctype="multipart/form-data" bind:this={bulkEntryFormRef}>
        <p>Upload judges data as a CSV file</p>
        <input type="file" name="csvFile" class="file-input" aria-label="Upload CSV file" />
        <p>Or enter judges as comma-separated strings</p>
        <textarea aria-label="Judges string input" name="csvText" class="textarea w-full" placeholder="judge1,email1&#13;judge2,email2"></textarea>
        <div class="space-x-3 text-right">
          <button type="submit" class="btn btn-neutral btn-outline" onclick={() => bulkEntryFormRef.reset()}> Reset </button>
          <button type="submit" class="btn btn-primary"> Submit </button>
        </div>
        <div class="rounded-md border border-blue-400 bg-blue-100 p-3 text-sm">
          <p class="font-semibold">
            <IconTablerInfoCircle class="inline align-text-bottom" /> CSV format
          </p>
          <p>1st column: Judge name</p>
          <p>2nd column: Email</p>
          <p>Edit judges' categories after creation</p>
          <p>
            <span class="font-semibold">Note:</span> Don't provide headers. Entries will override existing judges if same email
          </p>
        </div>
      </form>
    </div>
  </div>
{/snippet}
