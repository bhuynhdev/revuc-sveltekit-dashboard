<script lang="ts">
  import { categoryTypes } from '$lib/constants'
  import type { Category } from '$lib/server/db/types'
  import IconTablerX from '~icons/tabler/x'
  import { updateCategory } from './categories.remote'

  interface EditCategoryFormProps {
    category: Category // The category object that we're currently editing
    onClose: () => void
  }

  const { category, onClose }: EditCategoryFormProps = $props()
</script>

<section>
  <header class="flex w-full justify-between">
    <h3 class="text-lg font-bold">Edit Category</h3>
    <button aria-label="Close" type="button" onclick={onClose} class="cursor-pointer">
      <IconTablerX width="32" height="32" />
    </button>
  </header>

  <form {...updateCategory.for(category.id).enhance(async ({ submit }) => await submit())} class="border-base-300 mt-4 rounded-md border">
    <header class="bg-gray-200 px-4 py-3">
      <h3 class="font-semibold">Category Info</h3>
    </header>
    <div class="p-4">
      <input type="hidden" name="categoryId" value={category.id} />

      <label class="fieldset">
        <span class="fieldset-legend text-sm">Name</span>
        <input class="input w-full" name="categoryName" value={category.name} required />
      </label>

      <fieldset class="fieldset">
        <legend class="fieldset-legend text-sm">Type</legend>
        {#each categoryTypes as categoryType}
          <label class="flex items-center gap-2">
            <input type="radio" name="categoryType" value={categoryType} class="radio radio-sm" checked={category.type === categoryType} required />
            <span class="text-base first-letter:capitalize">{categoryType}</span>
          </label>
        {/each}
      </fieldset>

      <button type="submit" class="btn btn-primary ml-auto block text-white"> Save Changes </button>
    </div>
  </form>
</section>
