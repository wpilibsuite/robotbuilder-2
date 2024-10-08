import { Box, Button, Tab, Tabs } from "@mui/material"
import { Controllers } from "./controller/Controller"
import { Subsystems } from "./subsystem/Subsystem"
import { Commands } from "./command/Commands"
import React, { useState } from "react"
import { makeNewProject, Project, regenerateFiles } from "../bindings/Project"
import $ from "jquery"
import {
  AtomicCommand,
  Param,
  Subsystem,
  SubsystemAction,
  SubsystemState,
} from "../bindings/Command"
import { CommandInvocation, Group, ParGroup, SeqGroup } from "../bindings/ir"
import { Robot } from "./robot/Robot"
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js"
import SettingsDialog from "./project/SettingsDialog"

type ProjectProps = {
  initialProject: Project;
}

const saveProject = (project: Project) => {
  const savedProject = JSON.stringify(project, null, 2)
  console.log(savedProject)

  const link = document.getElementById("download-link")
  const fileName = `${ project.settings["robotbuilder.general.project_name"] }.json`
  const file = new Blob([savedProject], { type: "text/plain" })
  link.setAttribute("href", window.URL.createObjectURL(file))
  link.setAttribute("download", fileName)
  link.click()
}

function mapToClass<T>(data: object, clazz): T {
  const instance = new clazz()
  Object.assign(instance, data)
  return instance
}

function loadCommand(command: AtomicCommand | ParGroup | SeqGroup): AtomicCommand | ParGroup | SeqGroup {
  switch (command.type) {
    case "Atomic":
      return mapToClass(command, AtomicCommand)
    case "Parallel":
    {
      const group: ParGroup = mapToClass(command, ParGroup)
      group.commands = group.commands.map(data => {
        if (data.type === "Parallel" || data.type === "Sequence") {
          return loadCommand(data) as unknown as Group
        } else {
          // invocation
          return mapToClass(data, CommandInvocation)
        }
      })
      return group
    }
    case "Sequence":
    {
      const seq: SeqGroup = mapToClass(command, SeqGroup)
      seq.commands = seq.commands.map(data => {
        if (data.type === "Parallel" || data.type === "Sequence") {
          return loadCommand(data)
        } else {
          // invocation
          return mapToClass(data, CommandInvocation)
        }
      })
      return seq
    }
    default:
      return command
  }
}

const loadProject = (file: File): Promise<Project> => {
  console.log("[LOAD-PROJECT] loadProject(", file, ")")
  return file.text()
    .then(text => {
      console.log(text)
      const project: Project = JSON.parse(text)
      console.log(project)
      project.commands = project.commands.map(loadCommand)
      project.subsystems = project.subsystems.map(subsystemData => {
        const subsystemObj = new Subsystem()
        Object.assign(subsystemObj, subsystemData)
        subsystemObj.actions = subsystemData.actions.map((data) => {
          const action: SubsystemAction = mapToClass(data, SubsystemAction)
          action.params = action.params.map(a => mapToClass(a, Param))
          return action
        })
        subsystemObj.states = subsystemData.states.map((data) => mapToClass(data, SubsystemState))
        subsystemObj.commands = subsystemData.commands.map(c => mapToClass(c, AtomicCommand))
        return subsystemObj
      })
      // Controllers don't have classes, just a shape - so no prototype assignment is necessary

      console.log("[LOAD-PROJECT]", project)
      return project
    })
}

const exportProject = async (project: Project) => {
  const zipFileWriter = new BlobWriter()
  const zipWriter = new ZipWriter(zipFileWriter)

  // Work on a copy so we can exclude some things, like generated file contents, from the JSON
  // No need to include copies of files that are already in the export
  const projectCopy: Project = { ...project, generatedFiles: [] }
  const savedProjectContents = JSON.stringify(projectCopy, null, 2)

  await Promise.all(project.generatedFiles.map(file => {
    return zipWriter.add(file.name, new TextReader(file.contents))
  }).concat([
    zipWriter.add(`${ project.settings["robotbuilder.general.project_name"] }.json`, new TextReader(savedProjectContents)),
  ]))


  await zipWriter.close()
  const zipFile = await zipFileWriter.getData()

  const link = document.createElement("a")
  const objurl = URL.createObjectURL(zipFile)

  link.download = `${ project.settings["robotbuilder.general.project_name"] }.zip`
  link.href = objurl
  link.click()
}

export function ProjectView({ initialProject }: ProjectProps) {
  type Tab = "robot" | "controllers" | "subsystems" | "commands";
  const defaultTab: Tab = "robot"
  const [project, setProject] = useState(initialProject)
  const [selectedTab, setSelectedTab] = useState(defaultTab)
  const [settingsDialogProps, setSettingsDialogProps] = useState({ visible: true, allowCancel: false })

  const hideSettings = () => setSettingsDialogProps({ ...settingsDialogProps, visible: false })

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const renderContent = (selectedTab: Tab) => {
    switch (selectedTab) {
      case "robot":
        return (<Robot project={ project }/>)
      case "controllers":
        return (<Controllers project={ project }/>)
      case "subsystems":
        return (<Subsystems project={ project }/>)
      case "commands":
        return (<Commands project={ project }/>)
    }
  }

  return (
    <Box className="project-view">
      <SettingsDialog project={ project }
                      visible={ settingsDialogProps.visible }
                      allowCancel={ settingsDialogProps.allowCancel }
                      onCancel={ () => hideSettings() }
                      onSave={ (settings) => {
                        // Remove leading and trailing whitespace on save
                        // settings.name = settings.name.trim()
                        const newProject = { ...project, settings }
                        regenerateFiles(newProject)
                        hideSettings()
                        setProject(newProject)
                      } } />
      <Box className="header">
        <Box className="project-name-input">
          <span style={{ color: "white", fontWeight: "500", margin: "auto", marginLeft: "1rem", fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', textTransform: "uppercase", letterSpacing: "0.02857em", lineHeight: "1.25", fontSize: "0.875rem" }}>
            {
              (() => {
                if (/^[ ]*$/.test(project.settings["robotbuilder.general.project_name"] as string) || !(project.settings["robotbuilder.general.team_number"] as number > 0)) {
                  return null
                } else {
                  return (<>Team { project.settings["robotbuilder.general.team_number"] } - { project.settings["robotbuilder.general.project_name"] }</>)
                }
              })()
            }
          </span>
        </Box>

        <Box>
          <Tabs centered value={ selectedTab } onChange={ handleChange }>
            <Tab id={ "robot-tab" } label="Robot" value={ "robot" } />
            <Tab id={ "robot-subsystems-tab" } label="Subsystems" value={ "subsystems" }/>
            <Tab id={ "robot-commands-tab"} label="Commands" value={ "commands" }/>
            <Tab id={ "robot-controllers-tab" } label="Controllers" value={ "controllers" }/>
          </Tabs>
        </Box>
      </Box>

      { renderContent(selectedTab) }

      <Box className="footer">
        {/* Hidden link for use by downloads */ }
        <a style={ { display: "none" } } href="#" id="download-link"/>
        <Button onClick={ () => {
          setSettingsDialogProps({ visible: true, allowCancel: true })
        } }>
          Settings
        </Button>

        <Button onClick={ () => saveProject(project) }>Save</Button>

        <Button onClick={ () => exportProject(project) }>Export</Button>

        <input style={ { display: "none" } }
               type="file"
               id="load-project"
               onChange={ (e) => loadProject(e.target.files[0]).then(p => {
                 setProject(p)
               }) }/>
        <Button onClick={ () => $("#load-project").click() }>Load</Button>

        <Button onClick={ () => {
          // Create a new barebones project
          const newProject = makeNewProject()
          setProject(newProject)

          // Select the default tab
          handleChange(null, defaultTab)
          setSettingsDialogProps({ visible: true, allowCancel: false })
        } }>
          New
        </Button>
      </Box>
    </Box>
  )
}
