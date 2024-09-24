import React, { useEffect, useState } from "react";
import { findCommand, Project } from "../../bindings/Project";
import { Button, InputLabel } from "@mui/material";
import { entryType, StageEditor } from "./groupeditor/StageEditor";
import EditableLabel from "../EditableLabel";
import SyntaxHighlighter from 'react-syntax-highlighter';
import * as SyntaxHighlightStyles from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { commandMethod } from "../../codegen/java/CommandGroupGenerator";
import { editorGroupToIR } from "./Commands";
import * as IR from "../../bindings/ir";
import { CommandTile } from "./groupeditor/CommandTile";
import { AddCommandDropTarget } from "./groupeditor/AddCommandDropTarget";
import { ReactSVG } from "react-svg";

export class EditorCommandGroup {
  name: string;
  groupId: string;
  stages: EditorStage[] = [];

  static fromGroup(project: Project, group: IR.Group): EditorCommandGroup {
    console.log('EditorSequence.fromGroup(', group, ')');
    const sequence = new EditorCommandGroup();
    sequence.name = group.name;
    sequence.groupId = group.uuid;
    if (group instanceof IR.SeqGroup) {
      sequence.stages = group.commands.map((c, i) => {
        const stage = EditorStage.fromCommand(project, c);
        stage.group.name ??= `Stage ${ i }`;
        return stage;
      });
    } else if (group instanceof IR.ParGroup) {
      sequence.stages = [EditorStage.fromCommand(project, group)];
    } else {
      // ... shouldn't happen
    }
    sequence.stages.forEach((stage, i) => stage.name = `Stage ${ i + 1 }`);
    console.log('[EditorSequence.fromGroup] Created sequence:', sequence);
    return sequence;
  }
}

export class EditorStage {
  name: string;
  group: IR.ParGroup;

  static fromCommand(project: Project, command: IR.Invocation): EditorStage {
    const stage = new EditorStage();

    if (command instanceof IR.ParGroup) {
      stage.group = command;
    } else if (command instanceof IR.SeqGroup) {
      stage.group = IR.parallel("all", (p) => {
        p.commands.push(command);
      });
    } else if (command instanceof IR.CommandInvocation) {
      stage.group = IR.parallel("all", (p) => {
        p.commands.push(command);
      });
    } else {
      throw new Error(`Bad command: ${ JSON.stringify(command) }`);
    }

    return stage;
  }
}

type CommandGroupEditorProps = {
  group: EditorCommandGroup;
  project: Project;
  onSave: (sequence: EditorCommandGroup) => void;
  onChange: (sequence: EditorCommandGroup) => void;
}

export function CommandGroupEditor({ group, project, onSave, onChange }: CommandGroupEditorProps) {
  const addStage = () => {
    const newStage = new EditorStage();
    newStage.name = `Stage ${ group.stages.length + 1 }`;
    newStage.group = new IR.ParGroup("all");
    group.stages.push(newStage);
    onChange(group);
    regenerateCode();
  }

  const [generatedCode, setGeneratedCode] = useState((() => {
    const existingGroup = findCommand(project, group.groupId) as IR.Group;
    if (existingGroup) {
      const ir = editorGroupToIR(project, group);
      return commandMethod(group.name, ir, project);
    } else {
      const ir = new IR.SeqGroup();
      return commandMethod(group.name, ir, project);
    }
  })());

  useEffect(() => regenerateCode(), [group]);

  const regenerateCode = () => {
    const ir = editorGroupToIR(project, group);
    setGeneratedCode(commandMethod(group.name, ir, project));
    // Restart background animations when elements are added or removed
    if (document.getAnimations) {
      // `getAnimations` is undefined in tests
      document.getAnimations().forEach(a => a.startTime = 0);
    }
  }

  const updateAll = () => {
    group.stages = [...group.stages]
    onChange({ ...group })
    regenerateCode()
  }

  return (
    <div className="sequential-group-editor">
      <div className="sequential-group-title">
        <EditableLabel initialValue={ group.name }
                       onBlur={ (newName) => {
                         if (newName === group.name) {
                           // no change
                           return;
                         }
                         group.name = newName;
                         onChange({ ...group });
                         console.log('Changed sequence name to', newName);
                         regenerateCode();
                       } }/>
        <Button onClick={ () => onSave(group) }>
          Save Group
        </Button>
      </div>
      <div className={ "sequential-group-editor-commands" }>
        <table className="commands-table">
          <thead>
            <tr className="command-group-stage-row">
              <th className="subsystem-tile">
                Stage
              </th>
              {
                project.subsystems.sort((a, b) => a.name.localeCompare(b.name)).map(subsystem => {
                  return (
                    <th className="subsystem-tile" key={ subsystem.uuid }>
                      { subsystem.name }
                    </th>
                  )
                })
              }
            </tr>
          </thead>
          <tbody>
            {
              group.stages.map((stage, index) => {
                return (
                  <tr key={ index } className="command-group-stage-row">
                    <td style={{ minWidth: "150px" }} className="stage-detail-cell">
                      <span style={{ display: "flex" }}>
                        <EditableLabel initialValue={ stage.name }
                                      onBlur={ (newName) => {
                                        if (newName === stage.name) {
                                          // no change
                                          return
                                        }
                                        stage.name = newName
                                        onChange({...group})
                                        regenerateCode()
                                      } }/>

                        {
                          stage.group.commands.length > 1 ?
                            <>
                              <ReactSVG src={ 'icons/parallel-group-all-commands.svg' }
                                        style={ {
                                          cursor: "pointer",
                                          transform: `scale(${ stage.group.endCondition === "all" ? '112.5%' : '100%' })`
                                        } }
                                        onClick={ () => {
                                          stage.group.endCondition = "all";
                                          updateAll()
                                        } }/>
                              <ReactSVG src={ 'icons/parallel-group-any-commands.svg' }
                                        style={ {
                                          cursor: "pointer",
                                          transform: `scale(${ stage.group.endCondition === "any" ? '112.5%' : '100%' })`
                                        } }
                                        onClick={ () => {
                                          stage.group.endCondition = "any";
                                          updateAll()
                                        } }/>
                            </>
                            : null
                        }
                        {
                          // Do not display the "Delete" button if there's only one stage remaining
                          group.stages.length <= 1 ?
                          null
                          :
                          <Button className="delete-stage-button"
                                  onClick={ (e) => {
                                    console.log('Deleting stage', stage);
                                    const index = group.stages.indexOf(stage);
                                    group.stages.filter((_, i) => i > index).forEach((s, i) => s.name = `Stage ${ i + index + 1 }`);
                                    group.stages = group.stages.filter(s => s !== stage);
                                    if (group.stages.length === 0) {
                                      // Removed the last stage - add a new blank one instead of making the group have zero stages
                                      // (Shouldn't happen if the delete button isn't displayed... but just in case)
                                      addStage();
                                    }
                                    onChange({ ...group });
                                    regenerateCode();
                                  } }>
                            Delete
                          </Button>
                        }
                      </span>
                    </td>
                    {
                      project.subsystems.sort((a, b) => a.name.localeCompare(b.name)).map(subsystem => {
                        const command = stage.group.commands.find(c => c.requirements().includes(subsystem.uuid)) as IR.CommandInvocation

                        if (command) {
                          return (
                            <td key={ subsystem.uuid }>
                              <CommandTile key={ subsystem.uuid }
                                          project={ project }
                                          command={ command }
                                          stage={ stage }
                                          group={ group }
                                          entryType={ entryType(stage, command) }
                                          onChange={ (stage) => {
                                            updateAll()
                                          } }/>
                            </td>
                          )
                        } else {
                          return (
                            <td key={ subsystem.uuid }>
                              <AddCommandDropTarget key={ subsystem.uuid }
                                                    sequence={ group }
                                                    stage={ stage }
                                                    subsystem={ subsystem }
                                                    project={ project }
                                                    onChange={ (stage) => updateAll() }/>
                            </td>
                          )
                        }
                      })
                    }
                  </tr>
                )
              })
            }
            <tr className="command-group-stage-row footer-row">
              <td>
              <Button onClick={ addStage }>
                + Add Stage
              </Button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="sequential-group-code-preview">
          <SyntaxHighlighter
            language="java"
            style={ SyntaxHighlightStyles.vs }
            showLineNumbers={ true }
            wrapLines={ true }
          >
            { generatedCode }
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
