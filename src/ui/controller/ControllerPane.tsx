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
import React, { createRef, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

export type ControllerPaneProps = {
  controller: Controller;
  commands: Command[];
};

type CommandSelectBoxProps = {
  commands: Command[];
  initialCommand: string | undefined;
  onChange: any;
}

function CommandSelectBox({commands, initialCommand, onChange}: CommandSelectBoxProps) {
  return (
    <FormControl size="small" style={ {width: "100%"} }>
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
  config: ButtonConfig;
  scale: number;
  commands: Command[];
}

const imageScale = function (image: HTMLImageElement) {
  if (!image) {
    console.log("no image, defaulting to 1");
    return 1;
  }

  const scale = image.width / image.naturalWidth;
  console.log("Current image scale", scale, "image:", image);
  return scale;
}

function ButtonBindingDialog({button, config, scale, commands}: ButtonBindingDialogProps) {
  const updateButtonCommand = (bindingType: string, uuid: string) => {
    button[bindingType] = uuid;
  };

  return (
    <Card style={ {
      position: "absolute",
      // left: x,
      top: config.nodePos[1] * scale,
      transition: "all 0.1s"
    } } className={ "binding-dialog" } component={ Paper }>
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


const useRefScale = (ref) => {
  const [scale, setScale] = useState(1)
  React.useEffect(() => {
    if (ref.current) {
      console.log('Updating scale due to resize');
      const {current} = ref;
      setScale(imageScale(current));
    }
  }, [ref]);
  return scale;
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

  const [currentButton, setCurrentButton] = useState({button: null, config: null});
  const [showDialog, setShowDialog] = useState(false);

  const toggleDialog = (buttonConfig: ButtonConfig) => {
    if (showDialog && currentButton.config.name === buttonConfig.name) {
      setCurrentButton({button: null, config: null});
      setShowDialog(false);
    } else {
      let button: ControllerButton = props.controller.buttons.find(b => b.name === buttonConfig.name);
      if (!button) {
        // Create a new controller button for the bindings
        button = {name: buttonConfig.name}
        props.controller.buttons.push(button);
      }
      setCurrentButton({button: button, config: buttonConfig});
      setShowDialog(true);
    }
  }

  const [scale, setScale] = useState(1);
  const targetRef = useRef(null);
  useResizeDetector({ targetRef, onResize: (width, height) => { setScale(imageScale(targetRef.current)) } });

  return (
    <Box style={ {
      display: "grid",
      gridTemplateColumns: "400px 1fr 400px",
      position: "relative",
    } } className={ "controller-pane" }>
      <Box className={ "gutter left-gutter" }>
      </Box>
      <Box className={ "controller-center" }>
        <img ref={ targetRef } src={ config.imagePath } className={ "controller-image" }
             alt={ `${ config.name } Controller` }/>

        {
          config.buttons.map(button => {
            return (
              <span className={ "button-node-wrapper" }
                    style={ {position: "absolute", left: button.nodePos[0] * scale - 8, top: button.nodePos[1] * scale - 8} }
                    key={ `button-node-${ button.name }` }
                    onClick={ () => toggleDialog(button) }>
              { button.node }
            </span>
            );
          })
        }
      </Box>
      <Box className={ "gutter right-gutter" }>
        { showDialog ?
          <ButtonBindingDialog button={ currentButton.button }
                               config={ currentButton.config }
                               scale={ scale }
                               commands={ props.commands }/> : null
        }
      </Box>
    </Box>
  )
}

