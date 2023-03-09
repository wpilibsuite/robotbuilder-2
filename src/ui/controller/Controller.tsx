import { Box, Tab, Tabs } from "@mui/material";
import { Controller } from "../../bindings/Controller.ts";
import { ControllerPane } from "./ControllerPane.tsx";
import React from "react";
import { Command } from "../../bindings/Command";

export type ControllersProps = {
  controllers: Controller[];
  commands: Command[];
};

export function Controllers(props: ControllersProps) {
  const [controller, setController] = React.useState(props.controllers[0].uuid);

  return (
    <Box className={ "controllers" }>
      <Tabs onChange={ (_, newController) => setController(newController) }
            value={ controller }
            centered>
        {
          props.controllers.map((controller) => {
            return (
              <Tab label={ controller.name }
                   value={ controller.uuid }
                   key={ controller.name }/>
            );
          })
        }
      </Tabs>
      <ControllerPane controller={ props.controllers.find(c => c.uuid === controller) }
                      commands={ props.commands }/>
    </Box>
  );
}
