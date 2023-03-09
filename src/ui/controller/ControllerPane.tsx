import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
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
import { Controller, ControllerButton } from "../../bindings/Controller.ts";
import { PS5Controller } from "./configs/ps5.tsx";
import { ButtonConfig, ControllerConfig } from "./ControllerConfig";
import { Command } from "../../bindings/Command";
import React, { useState } from "react";
import $ from "jquery";
import { ReactSVG } from "react-svg";

export type ControllerPaneProps = {
  controller: Controller;
  commands: Command[];
};

type CommandSelectBoxProps = {
  commands: Command[];
  initialCommand: string | undefined;
  onChange: any;
}

function CommandSelectBox({ commands, initialCommand, onChange }: CommandSelectBoxProps) {
  return (
    <FormControl size="small" style={ { width: "100%" } }>
      <Select className={ "command-select" } variant={ "standard" } onChange={ onChange }
              defaultValue={ initialCommand ?? '' }>
        <MenuItem value={ '' } selected={ !initialCommand }>
          Unbound
        </MenuItem>
        {
          commands.map(command => {
            return (
              <MenuItem key={ command.uuid }
                        value={ command.uuid }
                        selected={ (command.uuid === initialCommand) }>
                { command.name }
              </MenuItem>
            );
          })
        }
      </Select>
    </FormControl>
  );
}

type ButtonBindingDialogProps = {
  button: ControllerButton;
  target: HTMLElement;
  commands: Command[];
}

function ButtonBindingDialog({ button, target, commands }: ButtonBindingDialogProps) {
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
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld?.uuid ?? '[none]' }` }
                                    commands={ commands }
                                    initialCommand={ button.whileHeld }
                                    onChange={ (event) => updateButtonCommand('whileHeld', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Press</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld?.uuid ?? '[none]' }` }
                                    commands={ commands }
                                    initialCommand={ button.whenPressed }
                                    onChange={ (event) => updateButtonCommand('whenPressed', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Toggle on press</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld?.uuid ?? '[none]' }` }
                                    commands={ commands }
                                    initialCommand={ button.toggleOnPress }
                                    onChange={ (event) => updateButtonCommand('toggleOnPress', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>When released</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld?.uuid ?? '[none]' }` }
                                    commands={ commands }
                                    initialCommand={ button.whenReleased }
                                    onChange={ (event) => updateButtonCommand('whenReleased', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>While released</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld?.uuid ?? '[none]' }` }
                                    commands={ commands }
                                    initialCommand={ button.whileReleased }
                                    onChange={ (event) => updateButtonCommand('whileReleased', event.target.value) }/>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Toggle on release</TableCell>
                <TableCell>
                  <CommandSelectBox key={ `${ button.name }-${ button?.whileHeld?.uuid ?? '[none]' }` }
                                    commands={ commands }
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

export function ControllerPane(props: ControllerPaneProps) {
  let config: ControllerConfig;
  switch (props.controller.type) {
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
      let button: ControllerButton = props.controller.buttons.find(b => b.name === buttonConfig.name);
      if (!button) {
        // Create a new controller button for the bindings
        button = { name: buttonConfig.name }
        props.controller.buttons.push(button);
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
              let button: ControllerButton = props.controller.buttons.find(button => button.name === name);
              if (!button) {
                button = { name: name };
                props.controller.buttons.push(button);
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
                               target={ currentButton.target }
                               commands={ props.commands }/> : null
        }
      </Box>
    </Box>
  )
}

