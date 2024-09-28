import { Project } from "../bindings/Project"
import { unindent } from "../codegen/java/util"

export const generateBundledPreferences = (project: Project): string => {
  return unindent(`
    {
      "enableCppIntellisense": false,
      "currentLanguage": "java",
      "projectYear": "2025",
      "teamNumber": ${ project.settings["robotbuilder.general.team_number"] }
    }
  `).trim()
}
