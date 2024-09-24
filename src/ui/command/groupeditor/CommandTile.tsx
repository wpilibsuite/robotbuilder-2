import React, { useState } from "react";
import { Divider, TextField } from "@mui/material";
import { EditorCommandGroup, EditorStage } from "../CommandGroupEditor";
import * as IR from '../../../bindings/ir'
import { findCommand, Project } from "../../../bindings/Project";
import { ActionParamCallOption, AtomicCommand } from "../../../bindings/Command";

type CommandTypeProps = {
  project: Project;
  command: IR.CommandInvocation;

  stage: EditorStage;
  group: EditorCommandGroup;

  onChange: (stage: EditorStage) => void;

  entryType: "full" | "leader" | "follower" | "racer";
}

function moveToStart<T>(arr: T[], finder: (element: T) => boolean) {
  const i = arr.findIndex(finder);
  if (i < 0) return;

  const [element] = arr.splice(i, 1);
  arr.unshift(element);
}

function remove<T>(arr: T[], element: T): boolean {
  const i = arr.indexOf(element);
  if (i >= 0) {
    arr.splice(i, 1);
    return true;
  }
  return false;
}

function removeIf<T>(arr: T[], predicate: (element: T) => boolean): boolean {
  let removed = false;
  while (arr.some(predicate)) {
    const index = arr.findIndex(predicate);
    arr.splice(index, 1);
    removed = true;
  }
  return removed;
}

function betterIncludes<T>(arr: T[], search: T): boolean {
  const serializedSearch = JSON.stringify(search);
  return arr.some(element => {
    return element === search || JSON.stringify(element) === serializedSearch;
  });
}

type CommandTileDetailsProps = {
  command: IR.CommandInvocation;
  stage: EditorStage;
  group: EditorCommandGroup;
  onChange: (stage: EditorStage) => void;
  entryType: "full" | "leader" | "follower" | "racer";
  hide: () => void;
}

function CommandTileDetails({ command, stage, group, entryType, onChange, hide }: CommandTileDetailsProps) {
  const makeLeader = () => {
    if (stage.group.endCondition !== command.command) {
      stage.group.endCondition = command.command;
      entryType = "leader";
      // leader command always goes first
      moveToStart(stage.group.commands, (c) => c === command);
    } else {
      // Reset
      stage.group.endCondition = "all"
    }
    onChange(stage);
  }

  const removeFromGroup = () => {
    remove(stage.group.commands, command);
    if (stage.group.commands.length === 0 || (stage.group.commands.length === 1 && stage.group.endCondition === command.command)) {
      // Reset to the default state when only 1 command is present and the leader is gone
      // (if the leader is the last one in the group, leave it be - presumably, the user will want to add new follower commands)
      stage.group.endCondition = "all";
    }
    removeIf(stage.group.params, p => command.params.some(cp => cp instanceof IR.ParamPlaceholder && cp.name === p.name));
    entryType = null;
    onChange(stage);
    hide();
  }

  return (
    <div
      style={ { backgroundColor: "rgba(0, 0, 0, 0.75)", color: "#eee", position: "fixed", zIndex: 1, width: "200px" } }>
      <div style={ { display: "grid", gridTemplateColumns: "1fr 30px 1fr" } }>
        {
          command.params.map((invocationParam: IR.ParamPlaceholder) => {
            // Allow editing of the params on the invocation
            // If the param is hardcoded, remove is as a passthrough from the associated parent param on the group
            // If that parent param has no more placeholders (i.e. it's no longer referenced), remove it from the group and from any invocations to the group (maybe only that last step after the group is saved...)
            // If the param is changed to pass through, either tie it to an existing param with the correct type or generate a new param on the group
            const currentGroupParam: IR.ParamPlaceholder = stage.group.params.find(p => p.passesThroughTo(invocationParam) || p.original === invocationParam.original);

            if (!currentGroupParam) {
              // BUG! No params on the group pass through to this one!
              return [
                <span>No parameters pass through to { invocationParam.name }!</span>,
                <span></span>,
                <span></span>
              ];
            }

            const togglePassthrough = () => {
              console.log('Clicked on invocation param', invocationParam, ', current group param is', currentGroupParam);
              if (currentGroupParam) {
                // toggle between hardcode and passthrough for now
                if (invocationParam.hardcodedValue) {
                  console.log('Making', invocationParam.name, 'pass through');
                  currentGroupParam.addPassthrough(invocationParam);
                  invocationParam.hardcodedValue = null;
                } else {
                  console.log('Making', invocationParam.name, 'hardcoded');
                  // look, this is overkill, but somehow params aren't always removed when they should be when
                  // looking only at currentGroupCommand and this is enough to make sure it gets completely removed
                  group.stages.flatMap(stage => stage.group.params).map(groupParam => groupParam.removePassthrough(invocationParam));
                  invocationParam.hardcodedValue = "/*TODO*/";
                }
              } else {
                console.warn("Couldn't find param referencing", invocationParam, 'in', group.stages.flatMap(stage => stage.group.params));
              }
              onChange(stage);
            };

            return ([
              <span>
                { invocationParam.name }
              </span>,
              <span style={ { cursor: "pointer", margin: "0px 4px" } } onClick={ togglePassthrough }>
                { !!invocationParam.hardcodedValue ? '</>' : '=>' }
              </span>,
              invocationParam.hardcodedValue ? (
                <TextField defaultValue={ invocationParam.hardcodedValue } onBlur={ (e) => {
                  invocationParam.hardcodedValue = (e.target as HTMLInputElement).value;
                  onChange(stage);
                } } variant="standard"/>
              ) : (
                <select onChange={ (e) => {
                  // Change which param passes through
                  const newCallerName = e.target.value;

                  const newGroupCommand = group.stages.flatMap(stage => stage.group.params).find(p => p.name === newCallerName);
                  if (!newGroupCommand) {
                    console.log('No caller found with name', newCallerName)
                    return; // selected a param that doesn't exist? how did this happen?
                  }

                  let removed: boolean | boolean[] = group.stages.flatMap(stage => stage.group.params).map(groupParam => groupParam.removePassthrough(invocationParam));
                  // const removed = currentGroupParam.removePassthrough(invocationParam);
                  if (!removed.some(wasRemoved => wasRemoved)) {
                    console.error('Invocation param', invocationParam, 'was not removed as a passthrough from group param', currentGroupParam);
                  }
                  if (newGroupCommand.passesThroughTo(invocationParam)) {
                    // shouldn't happen...
                    console.error(`Trying to add`, invocationParam, 'multiple times as a passthrough to', newGroupCommand);
                  } else {
                    console.log('Passing through', newGroupCommand, 'to invocation param', invocationParam);
                    newGroupCommand.addPassthrough(invocationParam);
                  }
                  onChange(stage);
                } } defaultValue={ currentGroupParam.name } >
                  {
                    // exclude params with hardcoded values
                    // exclude params without any current passthroughs, /except/ for the original param this was linked to
                    group.stages.flatMap(stage => stage.group.params).filter(p => !p.hardcodedValue).filter(p => p.passthroughs.length > 0 || p.name === invocationParam.name).map(topLevelParam => {
                      return (
                        <option value={ topLevelParam.name } key={ topLevelParam.name }>
                          { topLevelParam.name }
                        </option>
                      )
                    })
                  }
                </select>
              )
            ])
          })
        }
      </div>
      <Divider/>
      <span style={ { cursor: "pointer" } } onClick={ makeLeader }>👑</span>
      <span style={ { cursor: "pointer" } } onClick={ removeFromGroup }>🗑️</span>
    </div>
  )
}

export function CommandTile({ project, command, stage, group, entryType, onChange }: CommandTypeProps) {

  const [showDetails, setShowDetails] = useState(false)
  const toggleDetails = () => setShowDetails(!showDetails);

  const originalCommand = findCommand(project, command.command);

  return (
    <div className="command-tile-wrapper">
      <div
        className={ `command-tile ${ entryType }-group-entry ${ originalCommand instanceof AtomicCommand ? 'basic-command' : originalCommand instanceof IR.SeqGroup ? 'sequence-group' : originalCommand instanceof IR.ParGroup ? 'parallel-group' : 'unknown-type' }` }
        key={ command.command }
        onClick={ toggleDetails }>
        <div className={ "command-title" }>
          { findCommand(project, command.command).name }
        </div>
      </div>
      {
        showDetails ? (
          <CommandTileDetails command={ command } stage={ stage } group={ group } entryType={ entryType } onChange={ onChange } hide={ () => setShowDetails(false) }/>
        ) : <></>
      }
    </div>
  );
}
