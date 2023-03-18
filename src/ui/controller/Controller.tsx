import { Box, Tab, Tabs } from "@mui/material";
import { ControllerPane } from "./ControllerPane";
import { Project } from "../../bindings/Project";
import React from "react";

export type ControllersProps = {
  project: Project;
};

export function Controllers({  project }: ControllersProps) {
  const [controller, setController] = React.useState(project.controllers[0].uuid);

  return (
    <Box className={ "controllers" }>
      <Tabs onChange={ (_, newController) => setController(newController) }
            value={ controller }
            centered>
        {
          project.controllers.map((controller) => {
            return (
              <Tab label={ controller.name }
                   value={ controller.uuid }
                   key={ controller.name }/>
            );
          })
        }
      </Tabs>
      <ControllerPane project={ project }
                      controller={ project.controllers.find(c => c.uuid === controller) }/>
    </Box>
  );
}
