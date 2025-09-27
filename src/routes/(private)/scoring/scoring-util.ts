import type { EvaluationWithSubmissionAndProject, Project } from "$lib/server/db/types"

export function organizeEvaluationsByProject<T extends EvaluationWithSubmissionAndProject>(evaluations: T[]) {
  let map = new Map<Project['id'], Array<T>>()
  for (const e of evaluations) {
    const projectId = e.submission.projectId
    if (!map.get(projectId)) {
      map.set(projectId, [])
    }
    map.get(projectId)?.push(e)
  }
  return map
}

export type EvaluationsByProject = ReturnType<typeof organizeEvaluationsByProject>

export function organizeEvaluationsByJudge<T extends EvaluationWithSubmissionAndProject>(evaluations: T[]) {
  let map = new Map<Project['id'], Array<T>>()
  for (const e of evaluations) {
    const judgeId = e.judgeId
    if (!map.get(judgeId)) {
      map.set(judgeId, [])
    }
    map.get(judgeId)?.push(e)
  }

  return map
}

export type EvaluationsByJudge = ReturnType<typeof organizeEvaluationsByJudge>

// export function calculateZScoresByProject<T extends EvaluationWithSubmissionAndProject>(evaluations: T[]) {
//   const evaluationsByJudge = organizeEvaluationsByJudge(evaluations)
//
//   evaluationsByJudge.entries().map(([judgeId, evaluationsOfJudge]) => {
//     return
//   })
//   return
// }
