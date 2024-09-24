import { Controller } from "./Controller"
import { AtomicCommand, Subsystem } from "./Command"
import { v4 as uuidV4 } from "uuid"
import * as IR from '../bindings/ir'

export type Project = {
  name: string;
  controllers: Controller[];
  subsystems: Subsystem[];
  commands: IR.Group[];
};

export const makeNewProject = (): Project => {
  return {
    name: "New Project",
    controllers: [
      { name: "New Controller", uuid: uuidV4(), type: "ps5", className: 'CommandPS5Controller', fqn: '', port: 1 , buttons: [] },
    ],
    subsystems: [],
    commands: [],
  }
}

export function findCommand(project: Project, commandOrId: AtomicCommand | IR.Group | string): AtomicCommand | IR.Group | null {
  if (commandOrId instanceof AtomicCommand || commandOrId instanceof IR.Group) {
    // Passed in a command object, return it
    return commandOrId
  }

  const projectCommand = project.commands.find(c => c.uuid === commandOrId)
  if (projectCommand) return projectCommand

  const subsystemCommand = project.subsystems.flatMap(p => p.commands).find(c => c.uuid === commandOrId)
  if (subsystemCommand) return subsystemCommand

  console.warn('[findCommand] Could not find a command with UUID', commandOrId)
  return null
}
