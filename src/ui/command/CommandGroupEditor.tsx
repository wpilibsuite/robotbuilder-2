import React, { useEffect, useState } from "react";
import { findCommand, Project } from "../../bindings/Project";
import { Button, InputLabel } from "@mui/material";
import { StageEditor } from "./groupeditor/StageEditor";
import EditableLabel from "../EditableLabel";
import SyntaxHighlighter from 'react-syntax-highlighter';
import * as SyntaxHighlightStyles from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { commandMethod } from "../../codegen/java/CommandGroupGenerator";
import { editorGroupToIR } from "./Commands";
import * as IR from "../../bindings/ir";

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
      sequence.stages[0].name = group.name;
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
      </div>
      <div className={ "sequential-group-editor-commands" }>
        <div className="parallel-group-editor">
          <div className="group-header">
            <InputLabel>
              Subsystems
            </InputLabel>
          </div>
          {
            project.subsystems.map((subsystem) => {
              return (
                <div className={ `subsystem-tile` } key={ subsystem.uuid }>
                  <div className={ "command-title" }>
                    { subsystem.name }
                  </div>
                </div>
              )
            })
          }
        </div>
        {
          group.stages.map((stage, index) => {
            return (
              <StageEditor key={ JSON.stringify(stage) + `${ index }` }
                           sequence={ group }
                           stage={ stage }
                           project={ project }
                           onDelete={ (stage) => {
                             console.log('Deleting stage', stage);
                             const index = group.stages.indexOf(stage);
                             group.stages.filter((_, i) => i > index).forEach((s, i) => s.name = `Stage ${ i + index + 1 }`);
                             group.stages = group.stages.filter(s => s !== stage);
                             onChange({ ...group });
                             regenerateCode();
                           } }
                           onChange={ (stage) => {
                             group.stages = [...group.stages];
                             onChange({ ...group });
                             regenerateCode();
                             console.log('Regenerated code');
                           } }/>
            )
          })
        }
        <div className="sequential-group-add-stage">
          <Button onClick={ addStage }>
            + Add Stage
          </Button>
          <Button onClick={ () => onSave(group) }>
            Save Group
          </Button>
        </div>
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
