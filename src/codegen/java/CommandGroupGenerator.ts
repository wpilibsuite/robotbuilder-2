import { ActionParamCallOption, Param } from "../../bindings/Command";
import { findCommand, Project } from "../../bindings/Project";
import { indent, methodName, prettify, prettifySnippet, supplierFunctionType, unindent, variableName } from "./util";
import * as IR from '../../bindings/ir'
import { ParamPlaceholder } from "../../bindings/ir";

const flattenCommands = (allCommands: IR.CommandInvocation[], group: IR.Group) => {
  allCommands.push(...group.commands.filter(c => c instanceof IR.CommandInvocation) as IR.CommandInvocation[]);
  group.commands.filter(c => c instanceof IR.Group).forEach(g => {
    flattenCommands(allCommands, g as IR.Group);
  })
  return allCommands;
}

function findParamType(invokedCommands: IR.CommandInvocation[], p: ParamPlaceholder, project: Project): string {
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
  console.log('[COMMAND-METHOD] Generating factory method for command group', command);
  const invokedCommands = flattenCommands([], command);

  const params = command.params.filter(p => p.appearsOnFactory()).map(p => {
    const paramType = findParamType(invokedCommands, p, project);
    return `${ paramType } ${ variableName(p.name) }`;
  }).join(', ');

  const stageLine = (line: string, lineno: number): string => {
    if (lineno === 0) {
      return line;
    } else {
      const baseIndentation = 6 + 'return '.length;
      return indent(line, baseIndentation + 2);
    }
  };

  let body = '/* Add some commands! */';
  if (command.commands.length > 0) {
    body = 'return ' + commandBody(command, command, project).split('\n').map(stageLine).join('\n') + `.withName("${ name }")`;
  }

  return prettifySnippet(unindent(
    `
    public Command ${ methodName(name) }(${ params }) {
      ${ body };
    }
  `).trim());
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

function commandBody(topLevelGroup: IR.Group, command: IR.Invocation, project: Project): string {
  const decoratorCalls = decorators(command.decorators);

  let base = '';
  if (command instanceof IR.CommandInvocation) {
    const ownerRef = generateOwnerRef(command, project);
    const params = command.params.map(p => {
      if (p.hardcodedValue) {
        return p.hardcodedValue;
      } else {
        const args = topLevelGroup.params.filter(a => a.passesThroughTo(p));

        if (args.length === 1) {
          return variableName(args[0].name);
        } else {
          // This shouldn't happen, but just in case the validation checks fall through...
          return `/* ${ args.length } passthroughs to ${ p.name }! ${ args.map(a => a.name).join(' and ') } */`
        }
      }
    }).join(', ');

    const calledCommand = findCommand(project, command.command);
    base = `${ ownerRef }${ methodName(calledCommand?.name ?? 'unknown command') }(${ params })`;
  } else if (command instanceof IR.SeqGroup) {
    base = seqBody(topLevelGroup, command, project);
  } else if (command instanceof IR.ParGroup) {
    base = parBody(topLevelGroup, command, project);
  }

  if (decoratorCalls) {
    return base + '.' + decoratorCalls;
  } else {
    return base;
  }
}

function seqBody(topLevelGroup: IR.Group, group: IR.SeqGroup, project: Project): string {
  switch (group.commands.length) {
    case 0:
      return '(/* empty group */)';
    case 1:
      return commandBody(topLevelGroup, group.commands[0], project);
    default:
      return `${ commandBody(topLevelGroup, group.commands[0], project) }${ group.commands.slice(1).map(c => commandBody(topLevelGroup, c, project)).map(c => `\n.andThen(${ c })`).join('') }`
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

function parBody(topLevelGroup: IR.Group, group: IR.ParGroup, project: Project): string {
  switch (group.commands.length) {
    case 0:
      return '(/* empty group */)';
    case 1:
      return commandBody(topLevelGroup, group.commands[0], project);
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

      return `${ commandBody(topLevelGroup, seedCommand, project) }.${ decoratorMethod }(${ group.commands.filter(c => c !== seedCommand).map(c => commandBody(topLevelGroup, c, project)).join(', ') })`
  }
}

