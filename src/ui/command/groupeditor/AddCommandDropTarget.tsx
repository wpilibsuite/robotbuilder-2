import { findCommand, Project } from "../../../bindings/Project";
import React, { useState } from "react";
import { Command, CommandGroup, ParallelGroup, SequentialGroup, Subsystem } from "../../../bindings/Command";
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

type AddCommandDropTargetProps = {
  stage: EditorStage;
  subsystem: Subsystem;
  project: Project;
  onChange: (stage: EditorStage) => void
};

/**
 * Performs a logical XOR on two arrays of items.  Returns an array of the items that only appear in one array or the
 * other, but not both.
 *
 * @example
 * xor([1, 2], [1, 2]) // => []
 * xor([1, 2], [1, 3]) // => [2, 3]
 * xor([1, 2], [3, 4]) // => [1, 2, 3, 4]
 *
 * @param a1 the first array of items
 * @param a2 the second array of items
 */
function xor<T>(a1: T[], a2: T[]): T[] {
  let items = a1.concat(...a2);

  // kick out anything that appears more than once
  items = items.filter(i => items.indexOf(i) === items.lastIndexOf(i));

  return items;
}

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

  // TODO: Kick out the top-level command group that's being edited!
  const availableCommandsToAdd =
    allCommands
      .filter(c => c.uuid !== stage.group?.uuid)
      .filter(c => !stage.commands.find(sc => c.runsCommand(project, sc))) // exclude any groups that include (even implicitly) the group we'd be adding to
      .filter(c => c.usedSubsystems(project).includes(subsystem.uuid)) // only allow the commands that use the subsystem we're on
      .filter(c => stage.commands.length === 0 || xor(c.usedSubsystems(project), stage.commands.flatMap(sc => sc.usedSubsystems(project))).length === project.subsystems.length) // exclude any commands that use a subsystem already in use

  console.log('[ADD-COMMAND-DROP-TARGET] Available commands for stage', stage.name, ', subsystem', subsystem.name, ':', availableCommandsToAdd);

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