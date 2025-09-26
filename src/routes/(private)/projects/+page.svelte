<script lang="ts">
  import IconTablerInfoCircle from '~icons/tabler/info-circle'
  import IconTablerPlus from '~icons/tabler/plus'
  import IconTablerTrash from '~icons/tabler/trash'
  import IconTablerX from '~icons/tabler/x'
  import { listCategories } from '../categories/categories.remote'
  import {
    createProjectAndSubmissions,
    deleteProject,
    importProjectsFromDevpost,
    listProjects,
    toggleProjectDisqualification,
    updateProjectInfo
  } from './projects.remote'

  const projects = listProjects()
  const categories = listCategories()

  const categoryIdToNameMap = $derived.by(() => {
    return categories.current?.reduce<Record<number, string>>((acc, cat) => {
      acc[cat.id] = cat.name
      return acc
    }, {})
  })

  let importCsvFormRef: HTMLFormElement
  let addProjectsModal: HTMLDialogElement
  let selectedProjectId = $state<number | null>(null)
  let selectedProject = $derived(projects.current?.find((p) => p.id === selectedProjectId))
</script>

<div class="drawer drawer-end m-auto flex flex-col items-center justify-center gap-6">
  <input
    id="project-info-drawer"
    type="checkbox"
    class="drawer-toggle"
    hidden
    checked={selectedProjectId !== null}
    onchange={(e) => {
      if (!e.currentTarget.checked) selectedProjectId = null
    }}
  />

  <div class="drawer-content w-full">
    <div class="flex items-end gap-10">
      <h2>Projects</h2>
      <button type="button" class="btn btn-primary btn-outline w-fit" onclick={() => addProjectsModal.showModal()}>
        <span aria-hidden="true"><IconTablerPlus /></span>
        Add projects
      </button>
    </div>

    <table class="mt-6 table">
      <thead>
        <tr>
          <th>Id</th>
          <th>Name</th>
          <th>Categories</th>
          <th class="sr-only">Edit</th>
          <th class="sr-only">Disqualify</th>
        </tr>
      </thead>
      <tbody>
        {#each projects.current || [] as project}
          <tr>
            <td>{project.id}</td>
            <td>{project.name}</td>
            <td>
              {project.submissions.map(({ categoryId }) => categoryIdToNameMap?.[categoryId]).join(', ')}
            </td>
            <td>
              <button type="button" class="btn btn-primary h-8 text-white" onclick={() => (selectedProjectId = project.id)}> Edit </button>
            </td>
            <td class="pl-0">
              <form {...deleteProject}>
                <input type="hidden" name="projectId" value={project.id} />
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

    <dialog id="add-projects-modal" class="modal" bind:this={addProjectsModal}>
      <div class="modal-box h-[600px] max-w-md lg:max-w-lg">
        <div class="flex justify-between">
          <h3 class="mb-4 text-lg font-bold">Add Judges</h3>
          <button class="cursor-pointer" aria-label="Close" onclick={() => addProjectsModal.close()}>
            <IconTablerX />
          </button>
        </div>
        {@render projectCreateForm()}
        <form method="dialog" class="modal-action">
          <button class="btn">Close</button>
        </form>
      </div>
    </dialog>
  </div>

  <div role="dialog" class="drawer-side">
    <label for="project-info-drawer" class="drawer-overlay"></label>
    <div class="bg-base-100 min-h-full w-full max-w-[500px] p-6">
      {#if selectedProject}
        {@render projectEditForm()}
      {:else}
        <p>No project selected</p>
      {/if}
    </div>
  </div>
</div>

{#snippet projectCreateForm()}
  <div class="tabs tabs-lift">
    <input type="radio" name="add_judges_form_tab" class="tab" aria-label="Manual entry" checked />
    <div class="tab-content border-base-300 bg-base-100 p-5">
      <form {...createProjectAndSubmissions} class="space-y-4" autocomplete="off">
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Project Name</span>
          <input class="input" name="name" placeholder="Cookie Clicker" required aria-label="Project name" />
        </div>
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Location</span>
          <input class="input" name="location" placeholder="25" type="text" required />
        </div>
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Location 2</span>
          <input class="input" name="location2" type="text" />
        </div>
        <div class="grid grid-cols-[7rem_1fr] items-center">
          <span class="text-sm">Categories</span>
          {#if categories.current}
            <select class="select h-auto" name="categoryIds" aria-label="Categories" multiple size={categories.current.length}>
              {#each categories.current as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          {/if}
        </div>
        <button type="submit" class="btn btn-primary ml-auto block"> Submit </button>
      </form>
    </div>

    <input type="radio" name="add_judges_form_tab" class="tab" aria-label="Bulk entry" />
    <div class="tab-content border-base-300 bg-base-100 p-5">
      <form {...importProjectsFromDevpost} class="space-y-3" enctype="multipart/form-data" bind:this={importCsvFormRef}>
        <p>Upload projects CSV from DevPost</p>
        <input type="file" name="csvFile" class="file-input" aria-label="Upload Projects CSV file from DevPost" />
        <div class="space-x-3 text-right">
          <button type="submit" class="btn btn-neutral btn-outline" onclick={() => importCsvFormRef.reset()}> Reset </button>
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

{#snippet projectEditForm()}
  {#if selectedProject}
    {@const project = selectedProject}
    <section>
      <header class="flex w-full justify-between">
        <h3 class="text-lg font-bold">Edit Project</h3>
        <button aria-label="Close" type="button" onclick={() => (selectedProjectId = null)} class="cursor-pointer">
          <IconTablerX width="32" height="32" />
        </button>
      </header>

      <!-- Project Info -->
      <form {...updateProjectInfo.enhance(async ({ submit }) => await submit())} class="border-base-300 mt-4 rounded-md border">
        <header class="bg-gray-200 px-4 py-3">
          <h3 class="font-semibold">Project Info</h3>
        </header>
        <div class="p-4">
          <input type="hidden" name="projectId" value={project.id} />

          <div class="fieldset">
            <span class="fieldset-legend text-sm">DevPost URL</span>
            {#if project.url}
              <a class="link link-primary text-sm" href={project.url} target="_blank"> {project.url.replace(/^https?:\/\//, '')} </a>
            {:else}
              <p>No Submission URL</p>
            {/if}
          </div>

          <label class="fieldset">
            <span class="fieldset-legend text-sm">Name</span>
            <input type="text" class="input w-full" name="name" value={project.name} required />
          </label>

          <label class="fieldset">
            <span class="fieldset-legend text-sm">Location</span>
            <input type="text" class="input w-full" name="location" value={project.location} required />
          </label>

          <label class="fieldset">
            <span class="fieldset-legend text-sm">Categories</span>
            {#if categories.current}
              <select name="categoryIds" class="select h-auto w-full" multiple required size={categories.current.length}>
                {#each categories.current as category}
                  <option value={category.id} selected={project.submissions.map((s) => s.categoryId).includes(category.id)}>
                    {category.name}
                  </option>
                {/each}
              </select>
            {/if}
          </label>
          <button type="submit" class="btn btn-primary mt-2 ml-auto block text-white"> Save Changes </button>
        </div>
      </form>

      <!-- Disqualification -->
      <form {...toggleProjectDisqualification} class="border-base-300 mt-4 rounded-md border">
        <header class="bg-gray-200 px-4 py-3">
          <h3 class="font-semibold">Disqualification</h3>
        </header>
        <div class="p-4">
          <p class="text-sm font-semibold">
            Status:
            {#if project.status === 'disqualified'}
              <span class="badge bg-red-400">{project.status}</span>
            {:else}
              <span class="badge badge-neutral badge-soft">{project.status}</span>
            {/if}
          </p>

          <input type="hidden" name="projectId" value={project.id} />

          {#if project.status === 'disqualified'}
            <label class="fieldset">
              <span class="fieldset-legend text-sm">Disqualification reason</span>
              <input type="text" class="input w-full" name="disqualifyReason" value={project.disqualifyReason ?? ''} required />
            </label>
            <div class="mt-2 flex justify-end gap-3">
              <button type="submit" name="update-disqualify-reason-only" value="true" class="btn btn-primary btn-outline">
                Update disqualification reason
              </button>
              <button type="submit" class="btn btn-primary text-white"> Re-qualify </button>
            </div>
          {:else}
            <label class="fieldset">
              <span class="fieldset-legend text-sm">Disqualification reason</span>
              <input type="text" class="input w-full" name="disqualifyReason" value={project.disqualifyReason ?? ''} required />
            </label>
            <button type="submit" class="btn btn-error mt-2 ml-auto block text-white"> Disqualify </button>
          {/if}
        </div>
      </form>
    </section>
  {/if}
{/snippet}
