import { Controller } from "./Controller.ts";
import { Command, Subsystem } from "./Command.ts";
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
      { name: "New Controller", uuid: uuidV4(), type: "ps5", buttons: [] }
    ],
    subsystems: [],
    commands: []
  };
};
