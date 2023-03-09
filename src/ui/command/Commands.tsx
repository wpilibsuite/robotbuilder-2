import { AtomicCommand, Command, ParallelGroup, SequentialGroup } from "../../bindings/Command.ts";
import { Project } from "../../bindings/Project";
import { Button } from "@mui/material";
import React, { useState } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditableLabel from "../EditableLabel.tsx";

type CommandTypeProps = {
  command: Command;

  group: ParallelGroup;

  rerender: () => void;

  entryType: "full" | "leader" | "follower" | "racer";
}

function CommandTile({ command, group, entryType, rerender }: CommandTypeProps) {
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

  let icon = null;

  if (entryType === "leader") {
    icon =
      <div className={ "leader-icon" }>
        {/* Five-pointed star */ }
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 51 48">
          <path d="m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z"/>
        </svg>
      </div>;
  }

  const removeLeader = () => {
    if (group.commands.length === 1)
      group.endCondition = "all";
    else
      group.endCondition = "any";
    entryType = "racer";
    handleClose();
    rerender();
  };

  const makeLeader = () => {
    group.endCondition = command.uuid;
    entryType = "leader";
    // leader command always goes first
    group.commands = group.commands.filter(uuid => uuid !== command.uuid);
    group.commands.unshift(command.uuid);
    handleClose();
    rerender();
  }

  const removeFromGroup = () => {
    group.commands = group.commands.filter(c => c !== command.uuid);
    if (group.commands.length === 0 || (group.commands.length === 1 && group.endCondition === command.uuid)) {
      // Reset to the default state when only 1 command is present and the leader is gone
      // (if the leader is the last one in the group, leave it be - presumably, the user will want to add new follower commands)
      group.endCondition = "all";
    }
    entryType = null;
    handleClose();
    rerender();
  }

  return (
    <div className={ `command-tile ${ entryType }-group-entry` }
         key={ command.uuid }
         onContextMenu={ handleContextMenu }>
      { icon }
      <div className={ "command-title" }>
        { command.name }
      </div>
      <Menu open={ contextMenu !== null }
            onClose={ handleClose }
            anchorReference="anchorPosition"
            anchorPosition={ contextMenu !== null ? { left: contextMenu.mouseX, top: contextMenu.mouseY } : undefined }>
        {
          entryType === "leader" ?
            <MenuItem onClick={ removeLeader }>Remove as leader</MenuItem> :
            <MenuItem onClick={ makeLeader }>Make Leader</MenuItem>
        }
        <MenuItem onClick={ removeFromGroup }>Remove</MenuItem>
      </Menu>
    </div>
  );
}

function SequentialGroupEditor({ commandGroup, project }: { commandGroup: SequentialGroup, project: Project }) {
  const [state, setState] = useState(false);
  const rerender = () => setState(!state);

  const addStage = () => {
    const newStage = new ParallelGroup();
    project.commands.push(newStage);
    newStage.name = "New Stage";
    newStage.endCondition = "all";
    commandGroup.commands.push(newStage.uuid);
    rerender();
  }

  return (
    <div className="sequential-group-editor">
      <div key={ commandGroup.uuid } className="sequential-group-title">
        { commandGroup.name }
      </div>
      <div className={ "sequential-group-editor-commands" }>
        {
          commandGroup.commands.map((uuid: string) => {
            const command = project.commands.find(c => c.uuid === uuid);
            if (!command) {
              console.warn('No command with UUID', uuid, 'found in the project commands:', project.commands.map(c => c.uuid));
              return null;
            }
            switch (command.type) {
              case "Atomic":
              case "SequentialGroup":
                // Wrap in a parallel group for editing
                // Exporting will detect command groups with a single entry and unwrap them
                const parallelWrapper = new ParallelGroup();
                parallelWrapper.name = command.name;
                parallelWrapper.endCondition = "all";
                parallelWrapper.commands.push(command);
                return (
                  <ParallelGroupEditor key={ command.uuid } commandGroup={ parallelWrapper } project={ project }
                                       rerender={ rerender }/>);
              case "ParallelGroup":
                return (<ParallelGroupEditor key={ command.uuid } commandGroup={ command } project={ project }
                                             rerender={ rerender }/>);
              default:
                console.error("Unexpected command type:", command.type, "Command:", command);
                return null;
            }
          })
        }
        <div className="sequential-group-add-stage">
          <Button onClick={ addStage }>
            + Add Stage
          </Button>
        </div>
      </div>
    </div>
  );
}

function ParallelGroupEditor({
                               commandGroup,
                               project,
                               rerender
                             }: { commandGroup: ParallelGroup, project: Project, rerender: () => void }) {
  const entryType = (group: ParallelGroup, command: Command) => {
    const endCond = group.endCondition;
    switch (endCond) {
      case "all":
        return "full";
      case "any":
        return "racer";
      case command.uuid:
        return "leader";
      default:
        if (project.commands.find(c => c.uuid === command.uuid)) {
          return "follower";
        } else {
          console.error("Parallel group end condition is not an expected value!", endCond);
          return "full";
        }
    }
  }

  return (
    <div className={ "parallel-group-editor" }>
      <div className={ "group-header" }>
        {/* TODO: Right-click on this for a context menu - contains options to change the end condition (at the very least, change from "all" to "any") and to remove the group outright from the sequence */ }
        <EditableLabel initialValue={ commandGroup.name ?? "_" } onBlur={ (value) => {
          if (value && value !== '') {
            commandGroup.name = value;
            rerender();
          }
        } }></EditableLabel>
      </div>
      {
        commandGroup.commands.map((uuid: string) => {
          const command = project.commands.find(c => c.uuid === uuid);

          return <CommandTile key={ command.uuid + Math.random() }
                              command={ command }
                              group={ commandGroup }
                              rerender={ rerender }
                              entryType={ entryType(commandGroup, command) }/>
        })
      }
      <AddCommandDropTarget commandGroup={ commandGroup } project={ project } rerender={ rerender }/>
    </div>
  );
}

function findUsedSubsystems(command: Command, project: Project): string[] {
  switch (command.type) {
    case "Atomic":
      return [(command as AtomicCommand).subsystem];
    case "ParallelGroup":
      return (command as ParallelGroup).commands.flatMap(c => findUsedSubsystems(project.commands.find(pc => pc.uuid === c), project));
    case "SequentialGroup":
      return (command as SequentialGroup).commands.flatMap(c => findUsedSubsystems(project.commands.find(pc => pc.uuid === c), project));
  }
}

function commandIncludes(group: SequentialGroup | ParallelGroup, command: Command, project: Project): boolean {
  if (group === command) {
    // As far as we're concerned, a group includes itself
    return true;
  }

  // FIXME: If A -> B -> C, command C is not considered a child of A!

  // A: The group's commands directly include the given command
  const directChild = !!group.commands.find(c => c.uuid === command.uuid);
  if (directChild) return true;

  // B: The group's nested groups include the given command
  const nestedGroups = group.commands.map(uuid => project.commands.find(c => c.uuid === uuid))
    .filter(c => c.type === "SequentialGroup" || c.type === "ParallelGroup");

  // Not a direct child and no nested groups to continue looking in
  if (nestedGroups.length === 0) return false;

  return !!nestedGroups.find(nestedGroup => commandIncludes(nestedGroup, command, project));
}

function AddCommandDropTarget({
                                commandGroup,
                                project,
                                rerender
                              }: { commandGroup: ParallelGroup, project: Project, rerender: () => void }) {
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
      commandGroup.commands.push(command.uuid);
      rerender();
      handleClose();
    };
  }

  const usedSubsystems = findUsedSubsystems(commandGroup, project);
  const availableCommandsToAdd =
    project.commands
      .filter(c => !commandGroup.commands.find(groupedCommand => groupedCommand === c.uuid)) // kick out any command that's already in the command group
      .filter(c => c.uuid !== commandGroup.uuid) // exclude the group itself
      .filter(c => c.type === "Atomic" || !commandIncludes(c, commandGroup, project)) // exclude any groups that include (even implicitly) the group we'd be adding to
      .filter(c => !findUsedSubsystems(c, project).find(s => usedSubsystems.includes(s)));

  return (
    <div>
      <Button className={ "command-drop-target" } onClick={ handleContextMenu }
              disabled={ availableCommandsToAdd.length < 1 }>
        + Add Command
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
        <MenuItem onClick={ handleClose }>
          Close
        </MenuItem>
      </Menu>
    </div>
  );
}


// Timeline view at the top for editing a command group (hidden if no group is selected)
// Below that, one column for each subsystem and one for command groups affecting multiple subsystems
// Drag-and-drop commands from the columns into the timeline editor

export function Commands({ project }: { project: Project }) {
  // If a sequential group is defined, initialize by showing the editor for the first one we find.
  const [editingSequentialGroup] = useState(project.commands.find(c => c.type === "SequentialGroup"));

  return (
    <div className={ "commands" }>
      { editingSequentialGroup ?
        <SequentialGroupEditor commandGroup={ editingSequentialGroup } project={ project }/> : null }
    </div>
  );
}
