import './App.scss';
import React from 'react';
import { makeNewProject } from "./bindings/Project";
import { ProjectView } from "./ui/ProjectView";

function App() {
  return <ProjectView initialProject={ makeNewProject() }/>
}

export default App;
