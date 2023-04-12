import { Project } from "../../bindings/Project";
import React, { useState } from "react";
import { CommandList } from "./CommandList";
import { CommandGroupEditor, EditorCommandGroup } from "./CommandGroupEditor";
import { CommandGroup, ParallelGroup, SequentialGroup } from "../../bindings/Command";
import { Button } from "@mui/material";

function createParallelGroup(project: Project, editorGroup: EditorCommandGroup): CommandGroup {
  // exactly one stage
  // special case and save as a parallel group

  const group = new ParallelGroup();
  group.name = editorGroup.name;
  group.uuid = editorGroup.groupId;
  const stage = editorGroup.stages[0];
  group.commands = stage.commands.map(c => c.uuid);
  group.endCondition = stage.endCondition;

  return group;
}

function createSequentialGroup(project: Project, editorGroup: EditorCommandGroup): CommandGroup {
  // two or more stages
  // if a stage has one command, inline that command instead of wrapping in a parallel group

  const group = new SequentialGroup();
  group.name = editorGroup.name;
  group.uuid = editorGroup.groupId;

  const stageCommands =
    editorGroup.stages
      .filter(s => s.commands.length > 0)
      .map(stage => {
        if (stage.commands.length === 1) {
          // inline
          return stage.commands[0];
        } else {
          // wrap in a parallel group
          const parallelGroup = new ParallelGroup();
          parallelGroup.name = `${ editorGroup.name } ${ stage.name }`;
          parallelGroup.commands = stage.commands.map(c => c.uuid);
          parallelGroup.endCondition = stage.endCondition;
          return parallelGroup;
        }
      });

  (group as any).commands = stageCommands.map(c => {
    if (c.type === "Atomic") return c.uuid; // reference the command
    return c; // inline it
  });

  return group;
}

function replace<T>(arr: T[], finder: (T) => boolean, newValue: T): T[] {
  const index = arr.findIndex(finder);
  arr.splice(index, 1, newValue);
  return arr;
}

export function saveEditorGroup(project: Project, editorGroup: EditorCommandGroup): CommandGroup {
  console.log('[SAVE-SEQUENCE] Sequence:', editorGroup);
  let group;
  if (editorGroup.stages.length === 0) {
    group = new SequentialGroup();
    group.name = editorGroup.name;
  } else if (editorGroup.stages.length === 1) {
    group = createParallelGroup(project, editorGroup);
  } else {
    group = createSequentialGroup(project, editorGroup);
  }

  if (project.commands.find(c => c.uuid === group.uuid)) {
    replace(project.commands, c => c.uuid === group.uuid, group);
  } else {
    project.commands.push(group);
  }

  console.log('[SAVE-SEQUENCE] Saved command group', group);

  return group;
}

export function Commands({ project }: { project: Project }) {
  const [editedSequence, setEditedSequence] = useState(null as EditorCommandGroup);
  const [sequenceSaved, setSequenceSaved] = useState(true);

  const requestGroupEdit = (group: CommandGroup) => {
    if (sequenceSaved) {
      setEditedSequence(EditorCommandGroup.fromGroup(project, group));
    } else {
      // TODO: Prompt to save the current sequence
    }
  }

  return (
    <div className={ "commands" }>
      {
        editedSequence ?
          <CommandGroupEditor group={ editedSequence }
                              project={ project }
                              onSave={ (seq) => {
                                saveEditorGroup(project, seq);
                                setSequenceSaved(true);
                              } }
                              onChange={ (seq) => {
                                console.log('Sequence changed to', seq);
                                setEditedSequence({ ...seq });
                                setSequenceSaved(false);
                              } }/> :
          null
      }
      <div style={ { display: "flex", flexDirection: "row", gap: "8px" } }>
        {
          project.subsystems.map(subsystem => {
            return (
              <CommandList key={ subsystem.uuid }
                           title={ subsystem.name }
                           commands={ subsystem.commands }
                           requestEdit={ requestGroupEdit }/>);
          })
        }
        <div>
          <CommandList title={ "Command Groups" }
                       commands={ project.commands }
                       requestEdit={ requestGroupEdit }/>
          <Button onClick={ () => {
            const group = new SequentialGroup();
            group.name = "New Command Group";
            requestGroupEdit(group);
          } }>
            Create New Group
          </Button>
        </div>
      </div>
    </div>
  );
}
