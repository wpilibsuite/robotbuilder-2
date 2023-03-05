import './App.scss';
import { Controller } from "./bindings/Controller.ts";
import React from 'react';
import { AtomicCommand } from "./bindings/Command.ts";
import { makeNewProject, Project } from "./bindings/Project.ts";
import { ProjectView } from "./ui/ProjectView.tsx";

function App() {
  const driverController: Controller = {
    name: "Driver",
    type:"ps5",
    buttons: [
      {
        name: "TRIANGLE",
        whileHeld: "hgkjhgkjhgkjhgh"
      },
      {
        name: "X",
        whenReleased: "ajlskhdjkl"
      }
    ]
  };

  let project: Project = {
    name: "New Project",
    controllers: [driverController],
    subsystems: [],
    commands: [
      { name: "Score High", uuid: "hgkjhgkjhgkjhgh" } as AtomicCommand,
      { name: "Score Mid", uuid: "kljh12klj3h" } as AtomicCommand,
      { name: "Score Low", uuid: "ajlskhdjkl" } as AtomicCommand
    ]
  };

  return <ProjectView initialProject={makeNewProject()} />
}

export default App;
