<script lang="ts">
  import IconTablerPlus from '~icons/tabler/plus'
  import IconTablerTrash from '~icons/tabler/trash'
  import IconTablerX from '~icons/tabler/x'
  import type { PageProps } from './$types'
  import CreateCategoryForm from './CreateCategoryForm.svelte'
  import EditCategoryForm from './EditCategoryForm.svelte'

  const { data }: PageProps = $props()

  let selectedCategoryId = $state<number | null>(null)
  let addCategoriesModal: HTMLDialogElement
  const selectedCategory = $derived(data.categories.find((c) => c.id === selectedCategoryId) || null)
</script>

<div class="drawer drawer-end m-auto flex flex-col items-center justify-center gap-6">
  <!-- Drawer toggle (hidden checkbox) -->
  <input
    id="category-info-drawer"
    type="checkbox"
    class="drawer-toggle"
    hidden
    checked={selectedCategoryId !== null}
    onchange={(e) => {
      if (selectedCategoryId !== null && !e.currentTarget.checked) selectedCategoryId = null
    }}
  />

  <div class="drawer-content w-full">
    <div class="flex items-end gap-10">
      <div>
        <h2>Categories</h2>
        <p>Names should appear exactly as in DevPost</p>
      </div>
      <button type="button" class="btn btn-primary btn-outline w-fit" onclick={() => addCategoriesModal.showModal()}>
        <span aria-hidden={true}>
          <IconTablerPlus />
        </span>
        Add categories
      </button>
    </div>

    <table class="mt-6 table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th class="sr-only">Edit</th>
          <th class="sr-only">Delete</th>
        </tr>
      </thead>
      <tbody>
        {#each data.categories as category}
          <tr>
            <td>{category.name}</td>
            <td>
              {#if category.type === 'inhouse'}
                <span class="badge bg-amber-300">Inhouse</span>
              {:else if category.type === 'sponsor'}
                <span class="badge bg-rose-400">Sponsor</span>
              {:else if category.type === 'general'}
                <span class="badge bg-gray-200">General</span>
              {:else if category.type === 'mlh'}
                <span class="badge bg-violet-400">MLH</span>
              {/if}
            </td>
            <td>
              <button type="button" class="btn btn-primary h-8 text-white" onclick={() => (selectedCategoryId = category.id)}>Edit</button>
            </td>
            <td class="pl-0">
              <form method="post" action="?/delete">
                <input type="hidden" name="categoryId" value={category.id} />
                <button type="submit" class="btn btn-error btn-soft h-8" aria-label="Delete">
                  <span class="hidden md:inline">Delete </span>
                  <span><IconTablerTrash /></span>
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Add Categories Modal -->
    <dialog id="add-categories-modal" class="modal" bind:this={addCategoriesModal}>
      <div class="modal-box h-[625px] max-w-md lg:max-w-lg">
        <div class="flex justify-between">
          <h3 class="mb-4 text-lg font-bold">Add Categories</h3>
          <button class="cursor-pointer" aria-label="Close" onclick={() => addCategoriesModal.close()}>
            <IconTablerX />
          </button>
        </div>
        <CreateCategoryForm />
        <form method="dialog" class="modal-action">
          <button class="btn">Close</button>
        </form>
      </div>
    </dialog>
  </div>

  <!-- Drawer side content -->
  <div role="dialog" class="drawer-side">
    <label for="category-info-drawer" class="drawer-overlay"></label>
    <div class="bg-base-100 min-h-full w-full max-w-[500px] p-6">
      {#if selectedCategory}
        <EditCategoryForm category={selectedCategory} onClose={() => (selectedCategoryId = null)} />
      {/if}
    </div>
  </div>
</div>
