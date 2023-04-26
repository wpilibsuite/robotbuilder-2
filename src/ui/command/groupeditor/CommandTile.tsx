import React, { useState } from "react";
import Menu from "@mui/material/Menu";
import { MenuItem } from "@mui/material";
import { EditorStage } from "../CommandGroupEditor";
import * as IR from '../../../bindings/ir'
import { findCommand, Project } from "../../../bindings/Project";

type CommandTypeProps = {
  project: Project;
  command: IR.CommandInvocation;

  stage: EditorStage;

  onChange: (stage: EditorStage) => void;

  entryType: "full" | "leader" | "follower" | "racer";
}

function moveToStart<T>(arr: T[], finder: (element: T) => boolean) {
  const i = arr.findIndex(finder);
  if (i < 0) return;

  const [element] = arr.splice(i, 1);
  arr.unshift(element);
}

function remove<T>(arr: T[], element: T) {
  const i = arr.indexOf(element);
  if (i >= 0) {
    arr.splice(i, 1);
  }
}

function removeIf<T>(arr: T[], predicate: (element: T) => boolean) {
  while (arr.some(predicate)) {
    const index = arr.findIndex(predicate);
    arr.splice(index, 1);
  }
}

export function CommandTile({ project, command, stage, entryType, onChange }: CommandTypeProps) {
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
    if (stage.group.commands.length === 1) {
      stage.group.endCondition = "all";
    } else {
      stage.group.endCondition = "any";
    }
    entryType = "racer";
    handleClose();
    onChange(stage);
  };

  const makeLeader = () => {
    stage.group.endCondition = command.command;
    entryType = "leader";
    // leader command always goes first
    moveToStart(stage.group.commands, (c) => c === command);
    handleClose();
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
    handleClose();
    onChange(stage);
  }

  return (
    <div className={ `command-tile ${ entryType }-group-entry` }
         key={ command.command }
         onContextMenu={ handleContextMenu }>
      { icon }
      <div className={ "command-title" }>
        { findCommand(project, command.command).name }
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
