import { Project } from "../bindings/Project"
import { unindent } from "../codegen/java/util"

export const generateReadme = (project: Project): string => {
  return unindent(`
    # ${ project.name }

    This is your robot program!
  `).trim()
}
