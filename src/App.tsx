import './App.scss';
import React from 'react';
import { makeNewProject } from "./bindings/Project.ts";
import { ProjectView } from "./ui/ProjectView.tsx";

function App() {
  return <ProjectView initialProject={ makeNewProject() }/>
}

export default App;
