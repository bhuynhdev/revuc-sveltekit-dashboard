import { parse } from 'csv-parse/sync'

const devPostCsvColsMapping = {
  'Project Title': 'title',
  'Submission Url': 'url',
  'Project Status': 'status',
  'Project Created At': 'createdAt',
  '"Try it out" Links': 'links',
  'Video Demo Link': 'videoLink',
  'Opt-In Prizes': 'categoriesCsv',
  'Submitter First Name': 'submitterFistName',
  'Submitter Last Name': 'submitterLastName',
  'Submitter Email': 'submitterEmail',
  'What Is The Table Number You Have Been Assigned By Organizers (Eg. 50)': 'location',
  'What School Do You Attend? If You Are No Longer In School, What University Did You Attend Most Recently?': 'school',
  'List All Of The Domain Names Your Team Has Registered With .Tech During This Hackathon.': 'domains'
} as const

export type RawDevPostProject = Record<keyof typeof devPostCsvColsMapping, string> & {
  [key: string]: string
}

export type TransformedDevPostProject = Record<(typeof devPostCsvColsMapping)[keyof typeof devPostCsvColsMapping], string> & {
  [key: string]: string
}

/**
 *  Parse the DevPost CSV:
 *  - Remap column headers to shorter names
 *  - Fix DevPost `...` header if there're multiple team members
 */
export function parseDevPostProjectsCsv(csvString: string) {

	const parsedProjects: Array<TransformedDevPostProject> = parse(csvString, {
		relaxColumnCount: true,
		skipEmptyLines: true,
		columns: (headers: string[]) =>
			headers.flatMap((header) => {
				if (header in devPostCsvColsMapping) {
					// Map DevPost long-text header to shorter headers
					return devPostCsvColsMapping[header as keyof typeof devPostCsvColsMapping]
				}
				if (header === '...') {
					// DevPost doesn't have headers for team members after 1 (it's just '...'), so we supply the headers manually here
					return [2, 3, 4].flatMap((i) => [`Team Member ${i} First Name`, `Team Member ${i} Last Name`, `Team Member ${i} Email`])
				}
				return header
			})
  })
  return parsedProjects
}



