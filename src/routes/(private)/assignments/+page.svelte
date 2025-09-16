<script lang="ts">
  import IconTablerStack2 from '~icons/tabler/stack-2'
  import { assignSubmissionsToJudgeGroups, listAssignments } from './assignments.remote'

  const assignments = listAssignments()

  type AssignmentDto = NonNullable<typeof assignments.current>[number]

  const assignmentsByJudgeGroup = $derived.by(() =>
    assignments.current?.reduce((map, curr) => {
      if (!map.has(curr.judgeGroupId)) map.set(curr.judgeGroupId, { judgeGroup: curr.judgeGroup, assignments: [] })
      map.get(curr.judgeGroupId)?.assignments.push(curr)
      return map
    }, new Map<number, { judgeGroup: AssignmentDto['judgeGroup']; assignments: AssignmentDto[] }>())
  )

  const judgeGroupsWithAssignments = $derived(
    Array.from(assignmentsByJudgeGroup!.values()).toSorted((a, b) => a.judgeGroup.name.localeCompare(b.judgeGroup.name))
  )
</script>

<div class="flex items-end gap-10">
  <div>
    <h2>Assignments</h2>
  </div>
  <div class="flex gap-4">
    <form {...assignSubmissionsToJudgeGroups} method="post">
      <button type="submit" class="btn btn-primary btn-outline w-fit">
        <span aria-hidden="true">
          <IconTablerStack2 />
        </span>
        Assign projects to groups
      </button>
    </form>
  </div>
</div>

{#if assignments.current && assignments.current.length}
  <div>
    <h3 class="my-4 font-semibold">Assignments ({assignments.current.length})</h3>
    <!-- Assignment listing -->
    <div class="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-6">
      {#each judgeGroupsWithAssignments as judgeGroup}
        <div class="relative h-fit rounded-xl border border-gray-400 p-4 shadow">
          <p class="ml-2 text-lg font-bold">Group {judgeGroup.judgeGroup.name} ({judgeGroup.judgeGroup.judges.length})</p>
          <p class="ml-2 text-sm font-italic">
            {judgeGroup.judgeGroup.category.name} ({judgeGroup.assignments.length})
          </p>
          <div class="mt-2 flex flex-col">
            {#each judgeGroup.assignments as assignment}
              <div class="group/judge flex items-center justify-between px-2 py-1 hover:bg-slate-100">
                <p>{assignment.submission.project.name}</p>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
