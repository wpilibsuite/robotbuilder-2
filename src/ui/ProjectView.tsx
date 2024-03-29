import { Box, Button, Tab, Tabs, TextField, } from "@mui/material";
import { Controllers } from "./controller/Controller";
import { Subsystems } from "./subsystem/Subsystem";
import { Commands } from "./command/Commands";
import React, { useState } from 'react';
import { makeNewProject, Project } from "../bindings/Project";
import $ from "jquery";
import {
  AtomicCommand,
  Command,
  Param,
  Subsystem,
  SubsystemAction,
  SubsystemState
} from "../bindings/Command";

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

function mapToClass<T>(data: Object, clazz: any): T {
  const instance = new clazz();
  Object.assign(instance, data);
  return instance;
}

function loadCommand(command: Command): Command {
  return command;
  // if (command.type === "Atomic") {
  //   return mapToClass<AtomicCommand>(command, AtomicCommand);
  // } else {
  //   switch (command.type) {
  //     case "SequentialGroup":
  //       command = mapToClass<SequentialGroup>(command, SequentialGroup);
  //       break;
  //     case "ParallelGroup":
  //       command = mapToClass<ParallelGroup>(command, ParallelGroup);
  //       break;
  //   }
  //
  //   command.commands = command.commands.map(ci => {
  //     if (typeof ci.command === "string") return ci;
  //
  //     return {
  //       command: loadCommand(ci.command),
  //       params: ci.params
  //     }
  //   });
  //
  //   return command;
  // }
}

const loadProject = (file: File): Promise<Project> => {
  console.log('[LOAD-PROJECT] loadProject(', file, ')');
  return file.text()
    .then(text => {
      console.log(text);
      const project: Project = JSON.parse(text);
      console.log(project);
      // project.commands = project.commands.filter(command => {
      //   switch (command.type) {
      //     case "SequentialGroup":
      //     case "ParallelGroup":
      //       return true;
      //     default:
      //       console.error('Unexpected command type', (command as any).type, 'was not one of "Atomic", "SequentialGroup", "ParallelGroup" - deleting');
      //       return false;
      //   }
      // }).map(commandData => loadCommand(commandData) as CommandGroup)
      project.subsystems = project.subsystems.map(subsystemData => {
        const subsystemObj = new Subsystem();
        Object.assign(subsystemObj, subsystemData);
        subsystemObj.actions = subsystemData.actions.map((data) => {
          const action: SubsystemAction = mapToClass(data, SubsystemAction);
          action.params = action.params.map(a => mapToClass(a, Param));
          return action;
        });
        subsystemObj.states = subsystemData.states.map((data) => mapToClass(data, SubsystemState));
        subsystemObj.commands = subsystemData.commands.map(c => mapToClass(c, AtomicCommand));
        return subsystemObj;
      });
      // Controllers don't have classes, just a shape - so no prototype assignment is necessary

      console.log('[LOAD-PROJECT]', project);
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
        return (<Controllers project={ project }/>);
      case "subsystems":
        return (<Subsystems project={ project }/>);
      case "commands":
        return (<Commands project={ project }/>);
    }
  }

  const [projectName, sn] = useState(project.name);

  const setProjectName = (name: string) => {
    console.debug('Setting project name to', name);
    sn(name);
    project.name = name;
  }

  const updateProjectName = (newName) => {
    if (!newName || newName.length < 1) return; // blank name, ignore the change

    setProjectName(newName);
  };

  return (
    <Box className="project-view">
      <Box className="header">
        <Box className="project-name-input">
          <TextField variant="standard"
                     value={ project.name }
                     onChange={ e => updateProjectName(e.target.value) }/>
        </Box>

        <Box>
          <Tabs centered value={ selectedTab } onChange={ handleChange }>
            <Tab id={ "robot-subsystems-tab" } label="Subsystems" value={ "subsystems" }/>
            <Tab id={ "robot-commands-tab"} label="Commands" value={ "commands" }/>
            <Tab id={ "robot-controllers-tab" } label="Controllers" value={ "controllers" }/>
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

        <input style={ { display: "none" } }
               type="file"
               id="load-project"
               onChange={ (e) => loadProject(e.target.files[0]).then(p => {
                 setProject(p);
                 setProjectName(p.name);
               }) }/>
        <Button onClick={ () => $('#load-project').click() }>Load</Button>

        <Button onClick={ () => {
          // Create a new barebones project
          const newProject = makeNewProject();
          setProject(newProject);

          // Select the default tab
          handleChange(null, defaultTab);
        } }>
          New
        </Button>
      </Box>
    </Box>
  );
}
