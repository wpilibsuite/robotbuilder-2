import { findCommand, Project } from "../../../bindings/Project";
import React, { useState } from "react";
import { Command, ParallelGroup, SequentialGroup, Subsystem } from "../../../bindings/Command";
import Menu from "@mui/material/Menu";
import { Button, Divider, MenuItem } from "@mui/material";
import { EditorStage } from "../CommandGroupEditor";


function findUsedSubsystems(command: Command, project: Project): string[] {
  switch (command.type) {
    case "Atomic":
      return [command.subsystem];
    case "ParallelGroup":
      return command.commands.flatMap(uuid => findUsedSubsystems(findCommand(project, uuid), project));
  }
}

function commandIncludes(group: SequentialGroup | ParallelGroup, command: Command, project: Project): boolean {
  if (group === command) {
    // As far as we're concerned, a group includes itself
    return true;
  }

  // FIXME: If A -> B -> C, command C is not considered a child of A!

  // A: The group's commands directly include the given command
  const directChild = !!group.commands.find(c => c === command.uuid);
  if (directChild) return true;

  // B: The group's nested groups include the given command
  const nestedGroups = group.commands.map(uuid => project.commands.find(c => c.uuid === uuid))
    .filter(c => c.type === "SequentialGroup" || c.type === "ParallelGroup");

  // Not a direct child and no nested groups to continue looking in
  if (nestedGroups.length === 0) return false;

  return !!nestedGroups.find(nestedGroup => commandIncludes(nestedGroup as SequentialGroup | ParallelGroup, command, project));
}

type AddCommandDropTargetProps = {
  stage: EditorStage;
  subsystem: Subsystem;
  project: Project;
  onChange: (stage: EditorStage) => void
};

export function AddCommandDropTarget({ stage, subsystem, project, onChange }: AddCommandDropTargetProps) {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu == null ?
        { mouseX: event.clientX, mouseY: event.clientY } :
        null
    );
  };
  const handleClose = () => setContextMenu(null);

  const addCommand = (command: Command) => {
    return () => {
      stage.commands.push(command);
      onChange(stage);
      handleClose();
    };
  }

  const allCommands = project.commands.concat(project.subsystems.flatMap(s => s.commands));
  console.log('[ADD-COMMAND-DROP-TARGET] All commands:', allCommands);

  const availableCommandsToAdd =
    allCommands
      .filter(c => c.uuid !== stage.group?.uuid)
      // .filter(c => c.type === "Atomic" || (stage.group && !commandIncludes(stage.group as SequentialGroup | ParallelGroup, stage.group, project))) // exclude any groups that include (even implicitly) the group we'd be adding to
      .filter(c => !c.usedSubsystems(project).includes(subsystem.uuid));
  console.log('[ADD-COMMAND-DROP-TARGET] Available commands:', allCommands);

  return (
    <div>
      <Button className={ "command-drop-target" }
              onClick={ handleContextMenu }
              disabled={ availableCommandsToAdd.length < 1 }>
        {
          availableCommandsToAdd.length > 0 ?
            '+ Add Command' :
            '' // No commands available for this subsystem
        }
      </Button>

      <Menu open={ contextMenu != null }
            anchorReference="anchorPosition"
            anchorPosition={ contextMenu !== null ? { left: contextMenu.mouseX, top: contextMenu.mouseY } : undefined }>
        {
          availableCommandsToAdd.map(command => {
            return (
              <MenuItem key={ command.uuid } onClick={ addCommand(command) }>
                { command.name }
              </MenuItem>
            )
          })
        }
        <Divider/>
        <MenuItem onClick={ handleClose }>
          Close
        </MenuItem>
      </Menu>
    </div>
  );
}