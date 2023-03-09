import { Box, Button, Tab, Tabs, } from "@mui/material";
import { Controllers } from "./controller/Controller.tsx";
import { Subsystems } from "./subsystem/Subsystem.tsx";
import { Commands } from "./command/Commands.tsx";
import React, { useRef, useState } from 'react';
import { makeNewProject, Project } from "./../bindings/Project.ts";
import $ from "jquery";
import EditableLabel from "./EditableLabel.tsx";
import {
  AtomicCommand,
  ParallelGroup,
  SequentialGroup,
  Subsystem,
  SubsystemAction,
  SubsystemState
} from "../bindings/Command.ts";

type ProjectProps = {
  initialProject: Project;
}

const saveProject = (project: Project) => {
  const savedProject = JSON.stringify(project, null, 2);
  console.log(savedProject);

  const link = document.getElementById('download-link');
  const fileName = `${ project.name }.json`;
  const file = new Blob([savedProject], { type: "text/plain" });
  link.setAttribute("href", window.URL.createObjectURL(file));
  link.setAttribute("download", fileName);
  link.click();
};

const loadProject = (file: File): Promise<Project> => {
  console.log('loadProject(', file, ')');
  return file.text()
    .then(text => {
      console.log(text);
      const project: Project = JSON.parse(text);
      console.log(project);
      project.commands = project.commands.filter(command => {
        switch (command.type) {
          case "Atomic":
            Object.setPrototypeOf(command, AtomicCommand);
            return true;
          case "SequentialGroup":
            Object.setPrototypeOf(command, SequentialGroup);
            return true;
          case "ParallelGroup":
            Object.setPrototypeOf(command, ParallelGroup);
            return true;
          default:
            console.error('Unexpected command type', command.type, 'was not one of "Atomic", "SequentialGroup", "ParallelGroup" - deleting');
            return false;
        }
      });
      project.subsystems.forEach(s => {
        Object.setPrototypeOf(s, Subsystem);
        s.actions.forEach(action => Object.setPrototypeOf(action, SubsystemAction));
        s.states.forEach(state => Object.setPrototypeOf(state, SubsystemState));
      });
      // Controllers don't have classes, just a shape - so no prototype assignment is necessary

      console.log(project);
      return project;
    });
}

export function ProjectView({ initialProject }: ProjectProps) {
  type Tab = "controllers" | "subsystems" | "commands";
  const defaultTab: Tab = "subsystems";
  const [project, setProject] = React.useState(initialProject);
  const [selectedTab, setSelectedTab] = React.useState(defaultTab);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const renderContent = (selectedTab: Tab) => {
    switch (selectedTab) {
      case "controllers":
        return (<Controllers controllers={ project.controllers } commands={ project.commands }/>);
      case "subsystems":
        return (<Subsystems project={ project }/>);
      case "commands":
        return (<Commands project={ project }/>);
    }
  }

  const [projectName, sn] = useState(project.name);

  const setProjectName = (name: string) => {
    sn(name);
    project.name = name;
  }

  const updateProjectName = (newName) => {
    if (!newName || newName.length < 1) return; // blank name, ignore the change

    setProjectName(newName);
  };

  const projectNameRef = useRef(null);

  return (
    <Box className="project-view">
      <Box className="header">
        <Box className="project-name-input">
          <EditableLabel initialValue={ projectName } onBlur={ updateProjectName }/>
        </Box>

        <Box>
          <Tabs centered value={ selectedTab } onChange={ handleChange }>
            <Tab label="Subsystems" value={ "subsystems" }/>
            <Tab label="Commands" value={ "commands" }/>
            <Tab label="Controllers" value={ "controllers" }/>
          </Tabs>
        </Box>
      </Box>

      { renderContent(selectedTab) }

      <Box className="footer">
        {/* Hidden link for use by downloads */ }
        {/* eslint-disable-next-line */ }
        <a style={ { display: "none" } } href="#" id="download-link"/>
        <Button onClick={ () => saveProject(project) }>Save</Button>

        <Button>Export</Button>

        <input style={ { display: "none" } } type="file" id="load-project"
               onChange={ (e) => loadProject(e.target.files[0]).then(setProject) }/>
        <Button onClick={ () => $('#load-project').click() }>Load</Button>

        <Button onClick={ () => {
          // Create a new barebones project
          const newProject = makeNewProject();
          setProject(newProject);

          // Select the default tab
          handleChange(null, defaultTab);
          $(projectNameRef.current).find('input').val(newProject.name);
        } }>New</Button>
      </Box>
    </Box>
  );
}
