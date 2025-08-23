<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { attendanceStatuses, DEFAULT_ITEMS_PER_PAGINATION } from '$lib/constants'
  import type { AttendanceStatus } from '$lib/server/db/types'
  import IconTablerChevronLeft from '~icons/tabler/chevron-left'
  import IconTablerChevronRight from '~icons/tabler/chevron-right'
  import { listParticipants, listParticipantsStatistics } from './participants.remote'

  const queryQs = $derived(page.url.searchParams.get('q') || null)
  const attendanceStatusQs = $derived((page.url.searchParams.get('status') || null) as AttendanceStatus | null)
  const pageNumber = $derived(Number(page.url.searchParams.get('page') ?? 1))
  const perPage = $derived(Number(page.url.searchParams.get('perpage') ?? DEFAULT_ITEMS_PER_PAGINATION))

  const participantsInfo = $derived(listParticipants({ query: queryQs, attendanceStatus: attendanceStatusQs, pageNumber, perPage }))
  const participantsStats = listParticipantsStatistics()

  let selectedParticipantId = $state<number | null>(null)
  const selectedParticipant = $derived(participantsInfo.current?.participants.find((p) => p.id == selectedParticipantId))

  function goTonextPage() {
    const query = new URLSearchParams(page.url.searchParams.toString())
    query.set('page', `${pageNumber + 1}`)
    goto(`?${query.toString()}`)
  }

  function goTopreviousPage() {
    const query = new URLSearchParams(page.url.searchParams.toString())
    query.set('page', `${Math.max(1, pageNumber - 1)}`)
    goto(`?${query.toString()}`)
  }
</script>

<div class="drawer drawer-end m-auto flex flex-col items-center justify-center gap-6">
  <!-- Set participant to null if drawer is checked off -->
  <input
    id="participant-info-drawer"
    type="checkbox"
    class="drawer-toggle"
    aria-hidden={true}
    checked={selectedParticipantId !== null}
    onchange={(e) => {
      if (!e.currentTarget.checked) {
        selectedParticipantId = null
      }
    }}
  />
  <div class="drawer-content w-full">
    {@render participantStatsCards()}
    <form
      method="get"
      class="grid grid-flow-col grid-cols-[repeat(auto-fit,minmax(100px,1fr))] items-end gap-2 rounded-lg bg-gray-100 p-4"
      role="search"
    >
      <label class="fieldset py-0">
        <span class="fieldset-legend pt-0 text-sm">Name &amp; Email</span>
        <input class="input pb-0" aria-label="Search participant" type="text" name="q" placeholder="Search" value={page.url.searchParams.get('q')} />
      </label>
      <label class="fieldset py-0">
        <span class="fieldset-legend pt-0 text-sm">Attendance status</span>
        <select class="select" name="status">
          <option value="" selected={!attendanceStatusQs}> --All-- </option>
          {#each attendanceStatuses as status}
            <option value={status} selected={status === attendanceStatusQs}>
              {status}
            </option>
          {/each}
        </select>
      </label>
      <button type="submit" class="btn btn-primary my-1 max-w-42"> Search </button>
    </form>
    <section aria-labelledby="participant-list-heading">
      <div class="my-5 flex items-center gap-16">
        <h2 id="participant-list-heading">Participant list</h2>
        {@render paginationButtons()}
      </div>

      <table aria-labelledby="participant-list-heading" class="table table-auto">
        <thead>
          <tr class="font-bold">
            <th>Name &amp; Email</th>
            <th>Status</th>
            <th class="sr-only hidden md:table-cell">Edit</th>
          </tr>
        </thead>
        <tbody>
          {#each (await participantsInfo).participants as p}
            <tr
              onpointerup={(e) => {
                if (e.pointerType === 'touch') {
                  selectedParticipantId = p.id
                }
              }}
            >
              <td>
                <p>
                  {p.firstName}
                  {p.lastName}
                </p>
                <p class="text-gray-500 italic">{p.email}</p>
              </td>
              <td>
                {p.attendanceStatus}
                <!-- <AttendanceStatusBadge attendanceStatus={p.attendanceStatus} /> -->
              </td>
              <td class="hidden sm:table-cell">
                <button
                  aria-label="Open Participant edit modal"
                  class="btn btn-primary h-8 min-h-8 text-white"
                  onclick={() => (selectedParticipantId = p.id)}
                >
                  Edit
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  </div>
  <div role="dialog" class="drawer-side">
    <label for="participant-info-drawer" class="drawer-overlay"></label>
    <div class="bg-base-100 min-h-full w-full max-w-[500px] p-6">
      {#if selectedParticipant}
        Participant {selectedParticipantId}
      {:else}
        <p>No participant selected</p>
      {/if}
    </div>
  </div>
</div>

{#snippet participantStatsCards()}
  {#if participantsStats.current}
    {@const { confirmed, confirmeddelayedcheckin, attended, waitlist, waitlistattended } = participantsStats.current.participantCountByStatus}
    <div class="mb-6 grid grid-cols-3 gap-3">
      <div class="rounded-lg bg-sky-200 p-4">
        <p class="text-xl font-bold">{confirmed + confirmeddelayedcheckin + attended + waitlistattended}</p>
        <p class="text-gray-500">Confirmed Attendance</p>
      </div>
      <div class="rounded-lg bg-emerald-200 p-4">
        <p class="text-xl font-bold">{attended + waitlistattended}</p>
        <p class="text-gray-500">Checked in</p>
        <p class="text-gray-500 italic">{waitlistattended} from waitlist</p>
      </div>
      <div class="rounded-lg bg-amber-200 p-4">
        <p class="text-xl font-bold">{waitlist}</p>
        <p class="text-gray-500">Waitlist</p>
      </div>
    </div>
  {/if}
{/snippet}

{#snippet paginationButtons()}
  {#if participantsInfo.current}
    {@const totalCount = participantsInfo.current.totalCount}
    {@const currentPageFirstItemIndex = (pageNumber - 1) * perPage + 1}
    {@const currentPageLastItemIndex = Math.min(currentPageFirstItemIndex + perPage - 1, totalCount)}
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-sm btn-soft btn-primary"
        aria-label="Previous page"
        title="Previous page"
        onclick={goTopreviousPage}
        disabled={pageNumber === 1}
      >
        <IconTablerChevronLeft />
      </button>
      <button
        type="button"
        class="btn btn-sm btn-soft btn-primary"
        aria-label="Next page"
        title="Next page"
        onclick={goTonextPage}
        disabled={currentPageLastItemIndex >= totalCount}
      >
        <IconTablerChevronRight />
      </button>
      <p class="ml-2 text-sm text-gray-600 italic">
        {currentPageFirstItemIndex} - {currentPageLastItemIndex} of {totalCount}
      </p>
    </div>
  {/if}
{/snippet}
