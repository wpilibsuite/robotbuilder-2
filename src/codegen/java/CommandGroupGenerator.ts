import { ActionParamCallOption, Param } from "../../bindings/Command";
import { findCommand, Project } from "../../bindings/Project";
import { indent, methodName, supplierFunctionType, unindent, variableName } from "./util";
import * as IR from '../../bindings/ir'
import { ParamPlaceholder } from "../../bindings/ir";

const flattenCommands = (allCommands: IR.CommandInvocation[], group: IR.Group) => {
  allCommands.push(...group.commands.filter(c => c instanceof IR.CommandInvocation) as IR.CommandInvocation[]);
  group.commands.filter(c => c instanceof IR.Group).forEach(g => {
    flattenCommands(allCommands, g as IR.Group);
  })
  return allCommands;
}

function findParamTypes(invokedCommands: IR.CommandInvocation[], p: ParamPlaceholder, project: Project): string {
  const realParam = p.original;
  if (realParam) {
    const actionParam = project.subsystems.flatMap(s => s.actions).find(a => a.uuid === realParam.action).params.find(p => p.uuid === realParam.param);
    switch (realParam.invocationType) {
      case "passthrough-value":
        return actionParam.type;
      case "passthrough-supplier":
        return supplierFunctionType(actionParam.type);
      case "hardcode":
        // shouldn't get here
        throw new Error(`Passing a value for parameter ${ actionParam.name } when it's already hardcoded to ${ realParam.hardcodedValue }`)
      default:
        throw new Error(`Unknown invocation type ${ realParam.invocationType }`);
    }
  }
  return '/* unknown */';
}

export function commandMethod(name: string, command: IR.Group, project: Project): string {
  const invokedCommands = flattenCommands([], command);

  const params = command.params.map(p => {
    const paramType = findParamTypes(invokedCommands, p, project);
    return `${ paramType } ${ p.name }`;
  }).join(', ');

  const stageLine = (line, lineno) => {
    if (lineno === 0) {
      return line;
    } else {
      const baseIndentation = 6 + 'return '.length;
      if (command.commands[0] instanceof IR.CommandInvocation) {
        const ownerRef = generateOwnerRef(command.commands[0], project);
        return indent(line, baseIndentation + ownerRef.length - 1 + (ownerRef === '' ? 2 : 0));
      } else if (command.commands[0] instanceof IR.ParGroup) {
        // incorrect, since the first command in the nested group may not be the seed command!
        let seed = findSeedCommand(command.commands[0]);
        while (seed instanceof IR.ParGroup) {
          seed = findSeedCommand(seed)
        }
        if (!seed) {
          return indent(line, baseIndentation + 2);
        }
        return indent(line, baseIndentation + generateOwnerRef(seed as IR.CommandInvocation, project).length - 1);
      } else {
        return indent(line, baseIndentation + 2);
      }
    }
  };

  let body = '/* Add some commands! */';
  if (command.commands.length > 0) {
    body = 'return ' + commandBody(command, project).split('\n').map(stageLine).join('\n');
  }

  return unindent(
    `
    public CommandBase ${ methodName(name) }(${ params }) {
      ${ body };
    }
  `).trim();
}

function decorators(decorators: IR.Decorator[]): string {
  if (decorators.length === 0) {
    return null;
  }

  return decorators.map(d => {
    switch (d.type) {
      case "duration":
        return `withTimeout(${ d.duration } /* seconds */)`;
      case "until":
        return `until(${ d.until })`;
      case "unless":
        return `unless(${ d.unless })`;
      case "repeat":
        return `repeatedly()`;
      default:
        // unsupported
        return null;
    }
  }).filter(d => !!d).join('.');
}

function generateOwnerRef(command: IR.CommandInvocation, project: Project, forMainRobot: boolean = true): string {
  if (forMainRobot && command.subsystems.length === 1) {
    const subsystem = project.subsystems.find(s => s.uuid === command.subsystems[0]);
    if (subsystem.commands.map(c => c.uuid).includes(command.command)) {
      // the command is defined within a subsystem and we're generating code for the main robot class
      return `${ variableName(subsystem.name) }.`;
    } else {
      // probably a command group that only uses commands that use a single subsystem (eg drive and then stop)
      return '';
    }
  } else {
    // defined in the same scope, no owner necessary
    return '';
  }
}

function commandBody(command: IR.Invocation, project: Project): string {
  const decoratorCalls = decorators(command.decorators);

  let base = '';
  if (command instanceof IR.CommandInvocation) {
    const ownerRef = generateOwnerRef(command, project);
    const params = command.params.map(p => {
      if (p instanceof IR.ParamPlaceholder) {
        return p.name;
      } else { // hardcoded values
        return p;
      }
    }).join(', ');

    const calledCommand = findCommand(project, command.command);
    base = `${ ownerRef }${ methodName(calledCommand?.name ?? 'unknown command') }(${ params })`;
  } else if (command instanceof IR.SeqGroup) {
    base = seqBody(command, project);
  } else if (command instanceof IR.ParGroup) {
    base = parBody(command, project);
  }

  if (decoratorCalls) {
    return base + '.' + decoratorCalls;
  } else {
    return base;
  }
}

function seqBody(group: IR.SeqGroup, project: Project): string {
  switch (group.commands.length) {
    case 0:
      return '(/* empty group */)';
    case 1:
      return commandBody(group.commands[0], project);
    default:
      return `${ commandBody(group.commands[0], project) }${ group.commands.slice(1).map(c => commandBody(c, project)).map(c => `\n.andThen(${ c })`).join('') }`
  }
}

function findSeedCommand(group: IR.ParGroup): IR.Invocation {
  switch (group.commands.length) {
    case 0:
      return null;
    case 1:
      return group.commands[0];
    default:
      switch (group.endCondition) {
        case "all":
        case "any":
          return group.commands[0];
        default:
          const uuid = group.endCondition;
          return group.commands.find(c => c instanceof IR.CommandInvocation && c.command === uuid);
      }
  }
}

function parBody(group: IR.ParGroup, project: Project): string {
  switch (group.commands.length) {
    case 0:
      return '(/* empty group */)';
    case 1:
      return commandBody(group.commands[0], project);
    default:
      let decoratorMethod: string;
      switch (group.endCondition) {
        case "all":
          decoratorMethod = "alongWith";
          break;
        case "any":
          decoratorMethod = "raceWith";
          break;
        default:
          decoratorMethod = "deadlineWith";
          break;
      }

      const seedCommand = findSeedCommand(group);

      return `${ commandBody(seedCommand, project) }.${ decoratorMethod }(${ group.commands.filter(c => c !== seedCommand).map(c => commandBody(c, project)).join(', ') })`
  }
}

