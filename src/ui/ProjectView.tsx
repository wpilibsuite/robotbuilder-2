import { Box, Button, Tab, Tabs, TextField, } from "@mui/material";
import { Controllers } from "./controller/Controller.tsx";
import { Subsystems } from "./subsystem/Subsystem.tsx";
import { Commands } from "./command/Commands.tsx";
import React, { useRef, useState } from 'react';
import { makeNewProject, Project } from "./../bindings/Project.ts";
import $ from "jquery";

type ProjectProps = {
  initialProject: Project;
}

const saveProject = (project: Project) => {
  const savedProject = JSON.stringify(project);
  console.log(savedProject);

  const link = document.getElementById('download-link');
  const fileName = `${ project.name }.json`;
  const file = new Blob([savedProject], {type: "text/plain"});
  link.setAttribute("href", window.URL.createObjectURL(file));
  link.setAttribute("download", fileName);
  link.click();
};

export function ProjectView({initialProject}: ProjectProps) {
  const [project, setProject] = React.useState(initialProject);
  const [selectedTab, setSelectedTab] = React.useState("controllers");

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  type Tab = "controllers" | "subsystems" | "commands";

  const renderContent = (selectedTab: Tab) => {
    switch (selectedTab) {
      case "controllers":
        return (<Controllers controllers={ project.controllers } commands={ project.commands }/>);
      case "subsystems":
        return (<Subsystems/>);
      case "commands":
        return (<Commands/>);
    }
  }

  const [projectName, sn] = useState(project.name);

  const setProjectName = (name: string) => {
    sn(name);
    project.name = name;
  }

  const updateProjectName = (event) => {
    const newName: string | undefined = event.target.value;

    if (!newName || newName.length < 1) return; // blank name, ignore the change

    setProjectName(newName);
  };

  const projectNameRef = useRef(null);

  return (
    <Box style={ {display: "flex", flexDirection: "column", width: "100%", height: "100%"} }>
      <Box className="header">
        <Box style={ {justifyContent: "center"} }>
          <TextField ref={ projectNameRef }
                     variant="standard"
                     placeholder="Set Project Name"
                     defaultValue={ projectName }
                     InputProps={{ className: "project-name-input" }}
                     onChange={ updateProjectName }/>
        </Box>

        <Box>
          <Tabs centered value={ selectedTab } onChange={ handleChange }>
            <Tab label="Controllers" value={ "controllers" }/>
            <Tab label="Subsystems" value={ "subsystems" }/>
            <Tab label="Commands" value={ "commands" }/>
          </Tabs>
        </Box>
      </Box>

      { renderContent(selectedTab) }

      <Box style={ {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "absolute",
        bottom: "0",
        marginBottom: 16
      } }>
        {/* Hidden link for use by downloads */ }
        <a style={ {display: "none"} } href="#" id="download-link"/>
        <Button onClick={ () => saveProject(project) }>Save</Button>

        <Button>Export</Button>

        <Button>Load</Button>

        <Button onClick={ () => {
          // Create a new barebones project
          const newProject = makeNewProject();
          setProject(newProject);

          // Select the default tab
          handleChange(null, "controllers");
          $(projectNameRef.current).find('input').val(newProject.name);
        } }>New</Button>
      </Box>
    </Box>
  );
}
