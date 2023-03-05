import { Controller } from "./Controller";
import { AtomicCommand, Command, Subsystem } from "./Command";
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
    subsystems: [
      { name: "New Subsystem", uuid: uuidV4(), actions: [], states: [] }
    ],
    commands: [
      { name: "New Command", uuid: uuidV4() } as AtomicCommand
    ]
  };
};
