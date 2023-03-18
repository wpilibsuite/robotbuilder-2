import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl, ListSubheader,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Controller, ControllerButton } from "../../bindings/Controller";
import { PS5Controller } from "./configs/ps5";
import { ButtonConfig, ControllerConfig } from "./ControllerConfig";
import { AtomicCommand } from "../../bindings/Command";
import React, { useState } from "react";
import $ from "jquery";
import { ReactSVG } from "react-svg";
import { Project } from "../../bindings/Project";

export type ControllerPaneProps = {
  project: Project;
  controller: Controller;
};

type CommandSelectBoxProps = {
  project: Project;
  initialCommand: string | undefined;
  onChange: any;
}

function groupArrayContents<K, V>(array: V[], groupingFunction: (V) => K): Map<K, V[]> {
  const object = new Map<K, V[]>();
  array.forEach(item => {
    const key = groupingFunction(item);
    if (!object.get(key)) {
      object.set(key, []);
    }
    object.get(key).push(item);
  })

  return object;
}

function CommandSelectBox({ project, initialCommand, onChange }: CommandSelectBoxProps) {
  const groupedAtomicCommands = groupArrayContents(
    project.subsystems.flatMap(s => s.commands) as AtomicCommand[],
    (c: AtomicCommand) => project.subsystems.find(s => s.uuid === c.subsystem)
  );

  return (
    <FormControl size="small" style={ { width: "100%" } }>
      <Select className={ "command-select" } variant={ "standard" } onChange={ onChange }
              defaultValue={ initialCommand ?? '' }>
        <MenuItem value={ '' } selected={ !initialCommand }>
          Unbound
        </MenuItem>
        {
          Array.from(groupedAtomicCommands.entries()).sort((a, b) => a[0].uuid.localeCompare(b[0].uuid)).flatMap(data => {
            const [subsystem, commands] = data;

            const groupHeader = <ListSubheader key={ subsystem.uuid }>{ subsystem.name }</ListSubheader>

            return [groupHeader].concat(
              commands.map(command => {
                return (
                  <MenuItem value={ command.uuid} key={ command.uuid }>{ command.name }</MenuItem>
                )
              })
            );
          })
        }
      </Select>
    </FormControl>
  );
}

type ButtonBindingDialogProps = {
  button: ControllerButton;
  project: Project;
}

function ButtonBindingDialog({ button, project }: ButtonBindingDialogProps) {
  const updateButtonCommand = (bindingType: string, uuid: string) => {
    button[bindingType] = uuid;
  };

  return (
    <Card className={ "binding-dialog" } component={ Paper }>
      <CardHeader title={ button.name }>{ button.name }</CardHeader>
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Command</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Press and hold</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld ?? '[none]' }` }
                                    project={ project }
                                    initialCommand={ button.whileHeld }
                                    onChange={ (event) => updateButtonCommand('whileHeld', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Press</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld ?? '[none]' }` }
                                    project={ project }
                                    initialCommand={ button.whenPressed }
                                    onChange={ (event) => updateButtonCommand('whenPressed', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Toggle on press</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld ?? '[none]' }` }
                                    project={ project }
                                    initialCommand={ button.toggleOnPress }
                                    onChange={ (event) => updateButtonCommand('toggleOnPress', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>When released</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld ?? '[none]' }` }
                                    project={ project }
                                    initialCommand={ button.whenReleased }
                                    onChange={ (event) => updateButtonCommand('whenReleased', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>While released</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld ?? '[none]' }` }
                                    project={ project }
                                    initialCommand={ button.whileReleased }
                                    onChange={ (event) => updateButtonCommand('whileReleased', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Toggle on release</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld ?? '[none]' }` }
                                    project={ project }
                                    initialCommand={ button.toggleOnRelease }
                                    onChange={ (event) => updateButtonCommand('toggleOnRelease', event.target.value) }/>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export function ControllerPane({ controller, project }: ControllerPaneProps) {
  let config: ControllerConfig;
  switch (controller.type) {
    case "ps5":
      config = PS5Controller;
      break;
    default:
      config = PS5Controller;
      break;
  }

  const [currentButton, setCurrentButton] = useState({ button: null, target: null });
  const [showDialog, setShowDialog] = useState(false);

  const toggleDialog = (buttonConfig: ButtonConfig, target: HTMLElement) => {
    if (showDialog && currentButton.button.name === buttonConfig.name) {
      setCurrentButton({ button: null, target: null });
      target.classList.remove("selected");
      setShowDialog(false);
    } else {
      let button: ControllerButton = controller.buttons.find(b => b.name === buttonConfig.name);
      if (!button) {
        // Create a new controller button for the bindings
        button = { name: buttonConfig.name }
        controller.buttons.push(button);
      }
      setCurrentButton({ button: button, target: target });
      target.classList.add("selected");
      setShowDialog(true);
    }
  }

  return (
    <Box className={ "controller-pane" }>
      <Box className={ "gutter left-gutter" }>
      </Box>
      <Box className={ "controller-center" }>
        <div key={ `controller-svg-${ config.name }` } className="controller-svg-wrapper" onClick={ (e) => {
          const uiButton = $(e.target).parent(".controller-button")[0];
          if (uiButton) {
            const name = $(uiButton).data("buttonName");
            if (name) {
              const bc = config.buttons.find(b => b.name === name);
              let button: ControllerButton = controller.buttons.find(button => button.name === name);
              if (!button) {
                button = { name: name };
                controller.buttons.push(button);
              }
              toggleDialog(bc, uiButton as HTMLElement);
            }
          }
        }
        }>
          <ReactSVG src={ config.svg }/>
        </div>
      </Box>
      <Box className={ "gutter right-gutter" }>
        { showDialog ?
          <ButtonBindingDialog button={ currentButton.button }
                               project={ project }/> : null
        }
      </Box>
    </Box>
  )
}

