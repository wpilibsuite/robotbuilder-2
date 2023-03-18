import { Controller } from "./Controller";
import { Command, Subsystem } from "./Command";
import { v4 as uuidV4 } from "uuid";

export type Project = {
  name: string;
  controllers: Controller[];
  subsystems: Subsystem[];
  commands: Command[];
};

export const makeNewProject = (): Project => {
  return {
    name: "New Project",
    controllers: [
      { name: "New Controller", uuid: uuidV4(), type: "ps5", port: 1 , buttons: [] }
    ],
    subsystems: [],
    commands: []
  };
};
