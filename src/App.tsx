import './App.scss';
import { Controller } from "./bindings/Controller.ts";
import {  Box, Tab, Tabs, } from "@mui/material";
import { Controllers } from "./ui/controller/Controller.tsx";
import { Subsystems } from "./ui/subsystem/Subsystem.tsx";
import { Commands } from "./ui/command/Command.tsx";
import React from 'react';
import { AtomicCommand } from "./bindings/Command";

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
        whileHeld: "nanananana"
      }
    ]
  };

  const config = {
    name: "Default Configuration",
    controllers: [driverController],
    subsystems: [],
    commands: [
      { name: "Score High", uuid: "hgkjhgkjhgkjhgh" } as AtomicCommand,
      { name: "Score Mid", uuid: "kljh12klj3h" } as AtomicCommand,
      { name: "Score Low", uuid: "ajlskhdjkl" } as AtomicCommand
    ]
  };

  const [selectedTab, setSelectedTab] = React.useState("controllers");
  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  type Tab = "controllers" | "subsystems" | "commands";

  const renderContent = (selectedTab: Tab) => {
    switch (selectedTab) {
      case "controllers":
        return (<Controllers controllers={config.controllers} commands={config.commands}></Controllers>);
      case "subsystems":
        return (<Subsystems></Subsystems>);
      case "commands":
        return (<Commands></Commands>);
    }
  }

  return (
    <Box style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <Box style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <h1>{ config.name }</h1>
      </Box>

      <Box>
        <Tabs centered value={selectedTab} onChange={handleChange}>
          {/*<Tab label={config.name} disabled/>*/}
          <Tab label="Controllers" value={"controllers"}/>
          <Tab label="Subsystems" value={"subsystems"}/>
          <Tab label="Commands" value={"commands"}/>
        </Tabs>
        { renderContent(selectedTab) }
      </Box>
    </Box>
  );
}

export default App;
