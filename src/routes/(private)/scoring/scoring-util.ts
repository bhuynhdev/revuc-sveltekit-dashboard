import type { EvaluationWithSubmissionAndProject, Judge, Project } from "$lib/server/db/types"
import { zScore, mean, standardDeviation } from 'simple-statistics'

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
  let map = new Map<Judge['id'], Array<T>>()
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

export function calculateZScoresByProject<T extends EvaluationWithSubmissionAndProject>(evaluations: T[]) {
  const evaluationsByJudge = organizeEvaluationsByJudge(evaluations) // Map<number, T[]>

  const evaluationsWithZScores =
    Array.from(evaluationsByJudge.values()).flatMap((evaluationsOfJudge) => {
      const allScore1s = evaluationsOfJudge.map(e => e.score1)
      const allScore2s = evaluationsOfJudge.map(e => e.score2)
      const allScore3s = evaluationsOfJudge.map(e => e.score3)

      const withZScores = evaluationsOfJudge.map(e => ({
        ...e,
        zScore1: calculateZScoreAcrossPopulation(allScore1s, e.score1),
        zScore2: calculateZScoreAcrossPopulation(allScore2s, e.score2),
        zScore3: calculateZScoreAcrossPopulation(allScore3s, e.score3),
      }))

      return withZScores
    })


  // Re-construct a map where the key is the Project id
  return organizeEvaluationsByProject(evaluationsWithZScores)
}

/**
  * Given a list of number, and a target number, return that target's zScore
  * Special rule: If any member of the population is 0, we return Nan, since 0-score means juding hasn't finished yet, and we shall not cast z-score evaluation
  */
function calculateZScoreAcrossPopulation(population: number[], target: number) {
  if (population.includes(0)) return NaN
  if (population.length === 0) return 0

  const meanValue = mean(population)
  const stdValue = standardDeviation(population)
  const zScoreValue = zScore(target, meanValue, stdValue)
  return zScoreValue
}
