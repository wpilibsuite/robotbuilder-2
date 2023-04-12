import React, { useState } from "react";
import Menu from "@mui/material/Menu";
import { MenuItem } from "@mui/material";
import { Command } from "../../../bindings/Command";
import { EditorStage } from "../CommandGroupEditor";

type CommandTypeProps = {
  command: Command;

  stage: EditorStage;

  onChange: (stage: EditorStage) => void;

  entryType: "full" | "leader" | "follower" | "racer";
}

export function CommandTile({ command, stage, entryType, onChange }: CommandTypeProps) {
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
    if (stage.commands.length === 1) {
      stage.endCondition = "all";
    } else {
      stage.endCondition = "any";
    }
    entryType = "racer";
    handleClose();
    onChange(stage);
  };

  const makeLeader = () => {
    stage.endCondition = command.uuid;
    entryType = "leader";
    // leader command always goes first
    stage.commands = stage.commands.filter(c => c.uuid !== command.uuid);
    stage.commands.unshift(command);
    handleClose();
    onChange(stage);
  }

  const removeFromGroup = () => {
    stage.commands = stage.commands.filter(c => c.uuid !== command.uuid);
    if (stage.commands.length === 0 || (stage.commands.length === 1 && stage.endCondition === command.uuid)) {
      // Reset to the default state when only 1 command is present and the leader is gone
      // (if the leader is the last one in the group, leave it be - presumably, the user will want to add new follower commands)
      stage.endCondition = "all";
    }
    entryType = null;
    handleClose();
    onChange(stage);
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
