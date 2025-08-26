<script lang="ts">
  import IconTablerX from '~icons/tabler/x'
  // import { AttendanceStatusBadge } from './AttendanceStatusBadge.svelte'
  import type { Participant } from '$lib/server/db/types'
  import type { ParticipantDto } from './participants.remote'

  type ParticipantInfoFormProps = {
    participant: ParticipantDto
    onClose?: () => void
  }

  const { participant, onClose }: ParticipantInfoFormProps = $props()

  const datetimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'medium'
  })

  const extraInfoFields: Array<keyof Participant> = [
    'phone',
    'gender',
    'age',
    'country',
    'school',
    'levelOfStudy',
    'graduationYear',
    'dietRestrictions',
    'resumeUrl',
    'notes'
  ]

  function camelCaseToTitleCase(text: string) {
    const result = text.replace(/([A-Z])/g, ' $1')
    return result.charAt(0).toUpperCase() + result.slice(1)
  }
</script>

<section class="flex w-full flex-col gap-2">
  <header class="flex w-full justify-between">
    <div class="flex items-center gap-2">
      <h2 class="text-base">Participant #{participant.id}</h2>
      <!-- <AttendanceStatusBadge attendanceStatus={participant.attendanceStatus} /> -->
    </div>
    <button aria-label="Close" type="button" onclick={onClose} class="cursor-pointer">
      <IconTablerX width="32" height="32" />
    </button>
  </header>

  <section class="flex gap-6" aria-label="Timestamp information">
    <p class="text-sm text-gray-600 italic">
      Created: <br />
      {datetimeFormatter.format(new Date(participant.createdAt))}
    </p>
    <p class="text-sm text-gray-600 italic">
      Confirmed Attendance: <br />
      {#if participant.lastConfirmedAttendanceAt}
        {datetimeFormatter.format(new Date(participant.lastConfirmedAttendanceAt))}
      {:else}
        No changes yet
      {/if}
    </p>
    <p class="text-sm text-gray-600 italic">
      Checked in: <br />
      {#if participant.checkedInAt}
        {datetimeFormatter.format(new Date(participant.checkedInAt))}
      {:else}
        Not yet
      {/if}
    </p>
  </section>

  <form id="participant-profile" method="post" class="border-base-300 mt-4 rounded-md border">
    <header class="bg-gray-200 px-4 py-3">
      <h3 class="font-semibold">Profile</h3>
    </header>
    <div class="p-4">
      <div class="flex gap-4">
        <label class="fieldset flex-1">
          <span class="fieldset-legend text-sm">First name</span>
          <input type="text" name="firstName" value={participant.firstName} class="input input-bordered w-full" />
        </label>
        <label class="fieldset flex-1">
          <span class="fieldset-legend text-sm">Last name</span>
          <input type="text" name="lastName" value={participant.lastName} class="input input-bordered w-full" />
        </label>
      </div>
      <label class="fieldset grow">
        <span class="fieldset-legend text-sm">Email</span>
        <input type="text" name="email" value={participant.email} class="input input-bordered w-full" />
      </label>

      <div class="collapse-arrow collapse">
        <input type="checkbox" />
        <div class="collapse-title px-0 text-sm font-semibold">Additional Information</div>
        <div class="collapse-content pl-1 text-sm">
          <ul class="-mt-4 flex list-inside list-disc flex-col gap-0.5">
            {#each extraInfoFields as field}
              <li>
                <span>{camelCaseToTitleCase(field)}</span>: <span>{participant[field]}</span>
              </li>
            {/each}
          </ul>
        </div>
      </div>

      <input type="hidden" name="participantId" value={participant.id} />
      <button type="submit" class="btn btn-primary text-base-100 ml-auto block w-32"> Save changes </button>
    </div>
  </form>

  <form method="post" class="border-base-300 rounded-md border-1">
    <header class="bg-gray-200 px-4 py-3">
      <h3 class="font-semibold">Attendance Status</h3>
    </header>
    <input type="hidden" name="participantId" value={participant.id} />
    <div class="space-y-4 p-4">
      <p>
        Attendance Status: <span class="font-bold">{participant.attendanceStatus}</span>
      </p>
      <div class="flex items-center gap-2">
        {#if participant.availableAttendanceActions.length === 0}
          <div>
            <p>No action needed</p>
            {#if participant.attendanceStatus.includes('waitlist')}
              <p>Remind participant to keep an eye on their emails for waitlist status updates</p>
            {/if}
          </div>
        {/if}

        {#if participant.availableAttendanceActions.includes('ConfirmAttendance')}
          <button type="submit" name="attendanceAction" value="ConfirmAttendance" class="btn btn-primary text-base-100"> Confirm Attendance </button>
        {/if}

        {#if participant.availableAttendanceActions.includes('CheckIn')}
          <button type="submit" name="attendanceAction" value="CheckIn" class="btn btn-primary text-base-100"> Check in </button>
        {/if}

        {#if participant.availableAttendanceActions.includes('Unconfirm')}
          <button type="submit" name="attendanceAction" value="Unconfirm" class="btn btn-outline"> Unconfirm </button>
        {/if}

        {#if participant.availableAttendanceActions.includes('ToggleLateCheckIn')}
          <button type="submit" name="attendanceAction" value="ToggleLateCheckIn" class="btn btn-outline">
            {participant.attendanceStatus === 'confirmed' ? 'Mark Late Check-in' : 'Unmark Late Check-in'}
          </button>
        {/if}
      </div>
    </div>
  </form>
</section>
