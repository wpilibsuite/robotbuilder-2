import {
  Command,
  CommandGroup,
  ParallelEndCondition,
  ParallelGroup
} from "../../bindings/Command";
import React, { useEffect, useState } from "react";
import { findCommand, Project } from "../../bindings/Project";
import { Button, InputLabel } from "@mui/material";
import { StageEditor } from "./groupeditor/StageEditor";
import EditableLabel from "../EditableLabel";
import SyntaxHighlighter from 'react-syntax-highlighter';
import * as SyntaxHighlightStyles from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  generateCommandGroup
} from "../../codegen/java/CommandGroupGenerator";
import { saveEditorGroup } from "./Commands";

export class EditorCommandGroup {
  name: string;
  groupId: string;
  stages: EditorStage[] = [];

  static fromGroup(project: Project, group: CommandGroup): EditorCommandGroup {
    console.log('EditorSequence.fromGroup(', group, ')');
    const sequence = new EditorCommandGroup();
    sequence.name = group.name;
    sequence.groupId = group.uuid;
    if (group.type === "SequentialGroup") {
      sequence.stages = group.commands.map(uuid => EditorStage.fromCommand(project, findCommand(project, uuid)));
    } else if (group.type === "ParallelGroup") {
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
  group: ParallelGroup;
  commands: Command[] = [];
  endCondition: ParallelEndCondition;

  static fromCommand(project: Project, command: Command): EditorStage {
    const stage = new EditorStage();
    stage.endCondition = "all";

    switch (command.type) {
      case "ParallelGroup":
        stage.group = command;
        stage.commands = command.commands.map(uuid => findCommand(project, uuid));
        stage.endCondition = command.endCondition;
        break;
      case "SequentialGroup":
        stage.commands = [command];
        break;
      case "Atomic":
        stage.commands = [command];
        break;
      default:
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
    newStage.endCondition = "all";
    group.stages.push(newStage);
    onChange(group);
    regenerateCode();
  }

  const [generatedCode, setGeneratedCode] = useState((() => {
    const projectCopy = JSON.parse(JSON.stringify(project));
    saveEditorGroup(projectCopy, group);
    return generateCommandGroup(findCommand(projectCopy, group.groupId) as CommandGroup, projectCopy);
  })());

  useEffect(() => regenerateCode(), [group]);

  const regenerateCode = () => {
    const projectCopy = JSON.parse(JSON.stringify(project));
    saveEditorGroup(projectCopy, group);
    setGeneratedCode(generateCommandGroup(findCommand(projectCopy, group.groupId) as CommandGroup, projectCopy));
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
