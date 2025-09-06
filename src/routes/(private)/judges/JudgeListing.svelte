<script lang="ts">
  import type { JudgeWithCategory } from '$lib/server/db/types'
  import IconTablerTrash from '~icons/tabler/trash'
  import { listJudges } from './judges.remote'
  import { listCategories } from '../categories/categories.remote'
  import IconTablerX from '~icons/tabler/x'

  const judges = listJudges()

  let judgeToEdit = $state<JudgeWithCategory | null>(null)

  function closeDrawer() {
    judgeToEdit = null
  }
</script>

<div class="drawer drawer-end m-auto flex flex-col items-center justify-center gap-6">
  <!-- Drawer toggle -->
  <input
    id="judge-info-drawer"
    type="checkbox"
    class="drawer-toggle"
    hidden
    checked={judgeToEdit !== null}
    onchange={(e) => {
      if (!e.currentTarget.checked) judgeToEdit = null
    }}
  />

  <!-- Table content -->
  <div class="drawer-content w-full">
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Email</th>
          <th class="sr-only">Edit</th>
          <th class="sr-only">Delete</th>
        </tr>
      </thead>
      <tbody>
        {#each judges.current || [] as judge}
          <tr>
            <td>
              <div class="flex w-56 justify-between">
                <span>{judge.name}</span>

                {#if judge.category.type === 'inhouse'}
                  <span class="badge bg-amber-300">Inhouse</span>
                {:else if judge.category.type === 'sponsor'}
                  <span class="badge bg-rose-400">Sponsor</span>
                {:else if judge.category.type === 'general'}
                  <span class="badge bg-gray-200">General</span>
                {:else if judge.category.type === 'mlh'}
                  <span class="badge bg-violet-400">MLH</span>
                {/if}
              </div>
            </td>
            <td>{judge.category.name}</td>
            <td>{judge.email}</td>

            <td>
              <button type="button" class="btn btn-primary h-8 text-white" onclick={() => (judgeToEdit = judge)}> Edit </button>
            </td>

            <td class="pl-0">
              <form method="post">
                <input type="hidden" name="judgeId" value={judge.id} />
                <button type="submit" class="btn btn-error btn-soft h-8" aria-label="Delete">
                  <span class="hidden md:inline">Delete </span>
                  <span>
                    <IconTablerTrash />
                  </span>
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Drawer side content -->
  <div role="dialog" class="drawer-side">
    <label for="judge-info-drawer" class="drawer-overlay"></label>
    <div class="bg-base-100 min-h-full w-full max-w-[500px] p-6">
      {#if judgeToEdit}
        {@render judgeEditForm(judgeToEdit, closeDrawer)}
      {:else}
        <p>No judge selected</p>
      {/if}
    </div>
  </div>
</div>

{#snippet judgeEditForm(judge: JudgeWithCategory, onClose: () => void)}
  <section>
    <header class="flex w-full justify-between">
      <h3 class="text-lg font-bold">Edit Judge</h3>
      <button aria-label="Close" type="button" onclick={onClose} class="cursor-pointer">
        <IconTablerX width="32" height="32" />
      </button>
    </header>
    <form method="post" class="border-base-300 mt-4 rounded-md border">
      <header class="bg-gray-200 px-4 py-3">
        <h3 class="font-semibold">Judge Info</h3>
      </header>
      <div class="p-4">
        <input type="hidden" name="judgeId" value="judge.id}" />
        <label class="fieldset">
          <span class="fieldset-legend text-sm">Name</span>
          <input type="text" class="input w-full" name="name" value={judge.name} required />
        </label>
        <label class="fieldset">
          <span class="fieldset-legend text-sm">Email</span>
          <input type="email" class="input w-full" name="email" value={judge.email} required />
        </label>
        <label class="fieldset">
          <span class="fieldset-legend text-sm">Category</span>
          <select name="categoryId" class="select w-full" required>
            {#each await listCategories() as category}
              <option value={category.id} selected={category.id === judge.categoryId}>
                {category.name}
              </option>
            {/each}
          </select>
        </label>
        <button type="submit" class="btn btn-primary mt-2 ml-auto block text-white"> Save Changes </button>
      </div>
    </form>
  </section>
{/snippet}
