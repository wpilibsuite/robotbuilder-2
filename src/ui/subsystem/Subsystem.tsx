import { Project } from "../../bindings/Project.ts";
import { Subsystem, SubsystemAction, SubsystemState } from "../../bindings/Command.ts";
import {
  Box,
  Button,
  Card,
  Dialog, DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Tab,
  Tabs, TextField
} from "@mui/material";
import React, { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

type BasicOpts = {
  subsystem: Subsystem;
  project: Project;
}

function SubsystemPane({ subsystem, project }: BasicOpts) {
  return (
    <Box className="subsystem-pane">
      <ActionsLane subsystem={ subsystem } project={ project }/>
      <StatesLane subsystem={ subsystem } project={ project }/>
      <CommandsLane subsystem={ subsystem } project={ project }/>
    </Box>
  );
}

function ActionsLane({ subsystem, project }: BasicOpts) {
  return (
    <Box className="subsystem-lane actions-lane">
      <h3>Actions</h3>
      <Box className="subsystem-lane-items">
        {
          subsystem.actions.map(action => {
            return (
              <Card key={ action.uuid } className="subsystem-lane-item" component={ Paper }>
                { action.name }
              </Card>
            )
          })
        }
        <Button>
          + Add Action
        </Button>
      </Box>
    </Box>
  );
}

function StatesLane({ subsystem, project }: BasicOpts) {
  return (
    <Box className="subsystem-lane states-lane">
      <h3>States</h3>
      <Box className="subsystem-lane-items">
        {
          subsystem.states.map(state => {
            return (
              <Card key={ state.uuid } className="subsystem-lane-item" component={ Paper }>
                { state.name }
              </Card>
            )
          })
        }
        <Button>
          + Add State
        </Button>
      </Box>
    </Box>
  );
}

function CommandsLane({ subsystem, project }: BasicOpts) {
  return (
    <Box className="subsystem-lane commands-lane">
      <h3>Commands</h3>
      <Box className="subsystem-lane-items">
        {
          project.commands.filter(c => c.type === "Atomic" && c.subsystem == subsystem.uuid).map(command => {
            return (
             <Card key={command.uuid} className="subsystem-lane-item" component={Paper}>
               { command.name }
             </Card>
            )
          })
        }
      </Box>
    </Box>
  );
}

function RenameSubsystemDialog({
                                 subsystem,
                                 onCancel,
                                 onAccept,
                                 defaultOpen
                               }: { subsystem: Subsystem, onCancel: () => void, onAccept: (string) => void, defaultOpen: boolean }) {

  // const [name, setName] = useState(subsystem?.name);
  let name = subsystem?.name;

  if (!subsystem) {
    console.warn('No subsystem given?');
    return null;
  }

  const handleCancel = () => {
    name = (subsystem.name);
    onCancel();
  }

  const handleAccept = () => {
    onAccept(name);
  }

  return (
    <Dialog open={ defaultOpen }>
      <DialogTitle>Rename { subsystem.name }</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Rename { subsystem.name }
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
          variant="standard"
          defaultValue={ name }
          onChange={ (e) => name = (e.target.value) }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={ handleCancel }>Cancel</Button>
        <Button onClick={ handleAccept }>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

export function Subsystems({ project }: { project: Project }) {
  const [currentSubsystem, setCurrentSubsystem] = useState(project.subsystems[0]);
  if (!project.subsystems.find(s => s.uuid === currentSubsystem.uuid)) {
    // Project changed and removed our subsystem.  Reset the component to display the first subsystem again.
    setCurrentSubsystem(project.subsystems[0]);
  }

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    subsystem: Subsystem;
  } | null>(null);

  const [contextMenuSubsystem, setContextMenuSubsystem] = useState(null);

  const handleContextMenu = (subsystem: Subsystem) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      console.log('handleContextMenu(', subsystem, ')');
      setContextMenuSubsystem(subsystem);
      setContextMenu(
        contextMenu == null ?
          { mouseX: event.clientX, mouseY: event.clientY, subsystem: subsystem } :
          null
      );
    };
  }

  const handleClose = () => {
    // setContextMenuSubsystem(null);
    setContextMenu(null);
  }

  const newSubsystem = () => {
    const newSubsystem = new Subsystem();
    newSubsystem.name = `Subsystem ${ newSubsystem.uuid.substring(0, 4) }`;
    project.subsystems.push(newSubsystem);
    setCurrentSubsystem(newSubsystem);
  };

  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const renameSubsystem = (subsystem: Subsystem) => {
    console.log('RENAME', subsystem);
    setContextMenuSubsystem(subsystem);
    setShowRenameDialog(true);
    handleClose();
  }

  const deleteSubsystem = (subsystem: Subsystem) => {
    console.log('DELETE', subsystem);
    const index = project.subsystems.indexOf(subsystem);
    project.subsystems = project.subsystems.filter(s => s !== subsystem);
    if (currentSubsystem === subsystem) {
      // Deleted the selected subsystem - select the tab to the left, or, if it was the leftmost one already,
      // select the new leftmost subsystem
      const newSelectedIndex = Math.max(0, index - 1);
      setCurrentSubsystem(project.subsystems[newSelectedIndex]);
    }
    handleClose();
  }

  return (
    <Box className="subsystems">
      <Tabs onChange={ (_, selectedUuid) => setCurrentSubsystem(project.subsystems.find(s => s.uuid === selectedUuid)) }
            value={ currentSubsystem.uuid } centered>
        {
          project.subsystems.map(subsystem => {
            return (
              <Tab label={ subsystem.name }
                   value={ subsystem.uuid }
                   key={ subsystem.uuid }
                   onContextMenu={ handleContextMenu(subsystem) }/>
            );
          })
        }
        <Tab label={ "+" }
             onClick={ newSubsystem }
             key={ "add-subsystem-tab" }/>
      </Tabs>
      <RenameSubsystemDialog subsystem={ contextMenuSubsystem }
                             onCancel={ () => setShowRenameDialog(false) }
                             onAccept={ (name: string) => {
                               contextMenuSubsystem.name = name;
                               setCurrentSubsystem(currentSubsystem);
                               setShowRenameDialog(false);
                             } }
                             defaultOpen={ contextMenuSubsystem !== null && showRenameDialog }/>
      <SubsystemPane subsystem={ currentSubsystem } project={ project }/>
      <Menu open={ contextMenu !== null }
            onClose={ handleClose }
            anchorReference="anchorPosition"
            anchorPosition={ contextMenu !== null ? { left: contextMenu.mouseX, top: contextMenu.mouseY } : undefined }>
        <MenuItem onClick={ () => renameSubsystem(contextMenuSubsystem) }>
          Rename
        </MenuItem>
        <MenuItem onClick={ () => deleteSubsystem(contextMenuSubsystem) }
                  disabled={ project.subsystems.length <= 1 }>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
