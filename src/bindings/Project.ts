import { Controller } from "./Controller";
import { Command, Subsystem } from "./Command";
import { v4 as uuidV4 } from "uuid";

export type Project = {
  name: string;
  controllers: Controller[];
  subsystems: Subsystem[];
  commands: Command[];
};

export const makeNewProject = (): Project => {
  return {
    name: "New Project",
    controllers: [
      { name: "New Controller", uuid: uuidV4(), type: "ps5", port: 1 , buttons: [] }
    ],
    subsystems: [],
    commands: []
  };
};

export function findCommand(project: Project, commandOrId: Command | string): Command | null {
  if (commandOrId.hasOwnProperty('type') &&
      ['Atomic', 'SequentialGroup', 'ParallelGroup'].includes(commandOrId['type'])) {
    // Passed in a command object, return it
    return commandOrId as Command;
  }

  const projectCommand = project.commands.find(c => c.uuid === commandOrId);
  if (projectCommand) return projectCommand;

  const subsystemCommand = project.subsystems.flatMap(p => p.commands).find(c => c.uuid === commandOrId);
  if (subsystemCommand) return subsystemCommand;

  console.warn('[findCommand] Could not find a command with UUID', commandOrId);
  return null;
}
