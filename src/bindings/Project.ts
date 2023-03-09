import { Controller } from "./Controller.ts";
import { AtomicCommand, Command, ParallelGroup, SequentialGroup, Subsystem } from "./Command.ts";
import { v4 as uuidV4 } from "uuid";

export type Project = {
  name: string;
  controllers: Controller[];
  subsystems: Subsystem[];
  commands: Command[];
};

export const makeNewProject = (): Project => {
  const subsystem: Subsystem = new Subsystem();
  Object.assign(subsystem, { name: "New Subsystem", uuid: uuidV4(), actions: [], states: [] });
  const command: AtomicCommand = { name: "New Command", uuid: uuidV4(), subsystem: subsystem.uuid, type: "Atomic" }

  subsystem.createAction("Sample Action");
  subsystem.createState("Sample State");

  const seq = new SequentialGroup();
  seq.name = "DEMO SEQUENTIAL COMMAND";

  const deadlineGroup = new ParallelGroup();
  deadlineGroup.name = "Deadline";
  const leader: AtomicCommand = {
    name: "Bold Leader",
    uuid: uuidV4(),
    subsystem: subsystem.uuid,
    type: "Atomic",
  };
  const follower: AtomicCommand = {
    name: "Meek Follower",
    uuid: uuidV4(),
    subsystem: null,
    type: "Atomic"
  };
  deadlineGroup.commands.push(leader.uuid);
  deadlineGroup.commands.push(follower.uuid);
  deadlineGroup.endCondition = leader.uuid;

  seq.commands.push(deadlineGroup.uuid);

  return {
    name: "New Project",
    controllers: [
      { name: "New Controller", uuid: uuidV4(), type: "ps5", buttons: [] }
    ],
    subsystems: [
      subsystem
    ],
    commands: [
      command,
      leader,
      follower,
      deadlineGroup,
      seq,
    ]
  };
};
