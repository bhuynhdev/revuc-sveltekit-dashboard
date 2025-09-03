<script lang="ts">
  import { categoryTypes } from '$lib/constants'
  import IconTablerInfoCircle from '~icons/tabler/info-circle'
    import { createCategoriesBulk, createCategory } from './categories.remote'

  let bulkEntryFormRef: HTMLFormElement
</script>

<div class="tabs tabs-lift">
  <input type="radio" name="add_categories_form_tab" class="tab" aria-label="Manual entry" checked />
  <div class="tab-content border-base-300 bg-base-100 p-5">
    {@render singleEntryForm()}
  </div>

  <input type="radio" name="add_categories_form_tab" class="tab" aria-label="Bulk entry" />
  <div class="tab-content border-base-300 bg-base-100 p-5">
    {@render bulkEntryForm()}
  </div>
</div>

{#snippet singleEntryForm()}
  <form {...createCategory} class="space-y-4">
    <label class="grid grid-cols-1 items-center gap-2 md:grid-cols-[3rem_1fr]">
      <span class="text-sm">Name</span>
      <input class="input" name="categoryName" placeholder="Best Education Hack" required />
    </label>
    <fieldset class="grid grid-cols-1 items-center gap-2 md:grid-cols-[3rem_1fr]">
      <legend class="contents text-sm">Type</legend>
      <div class="flex gap-2 sm:gap-4">
        {#each categoryTypes as categoryType, index}
          <label>
            <input type="radio" class="radio radio-xs mr-1.5" name="categoryType" value={categoryType} checked={index === 1} />
            <span class="capitalize">{categoryType}</span>
          </label>
        {/each}
      </div>
    </fieldset>
    <button type="submit" class="btn btn-primary ml-auto block"> Submit </button>
  </form>
{/snippet}

{#snippet bulkEntryForm()}
  <form {...createCategoriesBulk} class="space-y-3" enctype="multipart/form-data" bind:this={bulkEntryFormRef}>
    <p>Extract categories from DevPost Projects CSV</p>
    <input type="file" name="devPostProjectsFile" class="file-input" aria-label="Upload DevPost Projects CSV" />
    <p>Or enter categories as comma-separated strings</p>
    <textarea aria-label="Categories string input" name="csvText" class="textarea w-full" placeholder="category1,sponsor&#13;category2,inhouse"
    ></textarea>
    <div class="space-x-3 text-right">
      <button type="submit" class="btn btn-neutral btn-outline" onclick={() => bulkEntryFormRef.reset()}> Reset </button>
      <button type="submit" class="btn btn-primary"> Submit </button>
    </div>
    <div class="rounded-md border border-blue-400 bg-blue-100 p-3 text-sm">
      <p class="font-semibold">
        <IconTablerInfoCircle class="inline align-text-bottom" /> CSV format
      </p>
      <p>First column: category name</p>
      <p>Second column: type - 'sponsor' or 'inhouse'</p>
      <p>
        <span class="font-semibold">Note:</span> Entries will override existing categories if same name
      </p>
    </div>
  </form>
{/snippet}
