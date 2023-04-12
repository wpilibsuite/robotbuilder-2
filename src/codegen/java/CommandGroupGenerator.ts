import { Command, CommandGroup, ParallelGroup, SequentialGroup } from "../../bindings/Command";
import { findCommand, Project } from "../../bindings/Project";
import { methodName, unindent, variableName } from "./util";

function commandRef(command: Command, project: Project): string {
  if (!command) {
    // probably doesn't exist yet. show a dummy for now
    return '<unknown command>()';
  }

  if (command.type === "Atomic") {
    // comes from a subsystem
    const subsystem = project.subsystems.find(s => s.uuid === command.subsystem);
    return `${ variableName(subsystem.name) }.${ methodName(command.name) }()`;
  } else {
    // defined in the robot container
    if (command.type === "SequentialGroup") {

    } else if (command.type === "ParallelGroup") {
      return generateParallelCommandBody(command, project);
    }
    return `${ methodName(command.name) }()`;
  }
}

export function generateParallelCommandBody(group: ParallelGroup, project: Project): string {
  let seedCommand: Command;
  let decoratorMethod: string;
  switch (group.endCondition) {
    case "all":
      seedCommand = findCommand(project, group.commands[0]);
      decoratorMethod = "alongWith";
      break;
    case "any":
      seedCommand = findCommand(project, group.commands[0]);
      decoratorMethod = "raceWith";
      break;
    default:
      // assume a UUID
      seedCommand = findCommand(project, group.endCondition);
      decoratorMethod = "deadlineWith";
      break;
  }

  // return a single line
  // leave formatting/indentation to the caller
  return`${ commandRef(seedCommand, project) }.${ decoratorMethod }(${ group.commands.filter(uuid => uuid !== seedCommand.uuid).map(uuid => findCommand(project, uuid)).map(c => commandRef(c, project)).join(', ') })`;
}

export function generateParallelCommand(group: ParallelGroup, project: Project): string {
  return unindent(
    `
    public CommandBase ${ methodName(group.name) }() {
      return ${ generateParallelCommandBody(group, project) };
    }
    `
  ).trimStart().trimEnd();
}

export function generateSequentialCommand(group: SequentialGroup, project: Project): string {
  return unindent(
    `
    public SequentialCommandGroup ${ methodName(group.name) }() {
      return ${ commandRef(findCommand(project, group.commands[0]), project) }
${ group.commands.slice(1).map(uuid => `        .andThen(${ commandRef(findCommand(project, uuid), project) })`).join('\n') };
    }
    `
  ).trimStart().trimEnd();
}

export function generateCommandGroup(group: CommandGroup, project: Project): string {
  if (group.commands.length === 0) {
    // nothing here
    return unindent(
      `
      public CommandBase ${ methodName(group.name) }() {
        // Add a command to this group!
      }
      `
    ).trimStart().trimEnd();
  }

  if (group.commands.length === 1) {
    return unindent(
      `
      public CommandBase ${ methodName(group.name) }() {
        return ${ commandRef(findCommand(project, group.commands[0]), project) };
      }
      `
    ).trimStart().trimEnd();
  }

  switch (group.type) {
    case "SequentialGroup":
      return generateSequentialCommand(group, project);
    case "ParallelGroup":
      return generateParallelCommand(group, project);
  }
}
