<script lang="ts">
  import type { AttendanceStatus } from '$lib/server/db/types'

  type AttendanceStatusBadgeProps = {
    attendanceStatus: AttendanceStatus
  }

  const { attendanceStatus }: AttendanceStatusBadgeProps = $props()
</script>

{#if attendanceStatus === 'registered'}
  <span class="badge badge-neutral badge-soft">Registered</span>
{:else if attendanceStatus === 'declined'}
  <span class="badge bg-gray-300">Declined</span>
{:else if attendanceStatus === 'confirmed'}
  <span class="badge badge-primary">Confirmed</span>
{:else if attendanceStatus === 'attended'}
  <span class="badge bg-emerald-400">Attended</span>
{:else if attendanceStatus === 'waitlist'}
  <span class="badge bg-amber-400">Waitlist</span>
{:else if attendanceStatus === 'waitlistattended'}
  <div class="flex flex-col gap-1 md:flex-row">
    <span class="badge bg-emerald-400">Attended</span>
    <span class="badge bg-amber-400">Waitlist</span>
  </div>
{:else if attendanceStatus === 'confirmeddelayedcheckin'}
  <div class="flex gap-1">
    <span class="badge badge-primary">Confirmed</span>
    <span class="badge badge-error">Late</span>
  </div>
{:else}
  <span>{attendanceStatus}</span>
{/if}
