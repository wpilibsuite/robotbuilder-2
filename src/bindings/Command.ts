import { v4 as uuidV4 } from "uuid"

/**
 * The possible primitive types that can be passed as arguments to an action invocation.
 */
export type ParamType =
  | "int"
  | "long"
  | "double"
  | "boolean";

type UUID = string;

export type Unit = { name: string, symbol: string };

/**
 * A single parameter to a subsystem action.
 */
export class Param {
  /**
   * The name of the parameter.
   */
  name: string;

  uuid: string;

  /**
   * The type of the parameter.
   */
  type: ParamType;

  /**
   * Optional: a physical unit for the parameter (eg "feet" or "inches"). Useful to have as annotations, and can be used
   * by C++ to encode units in the type system.
   */
  unit?: Unit;

  constructor() {
    this.uuid = uuidV4();
  }
}

/**
 * An argument that may be passed to a subsystem action.
 */
export class Arg {
  param: Param;

  value: any;

  // Note: not specifying units because it's going to be whatever the parameter takes
}

export class SubsystemAction {
  /**
   * The name of the action. This should be unique among all actions on the subsystem.
   */
  name: string;

  uuid: string;

  subsystem: SubsystemRef;

  /**
   * The parameters available to be passed to the action. This may be empty.
   */
  params: Param[];

  constructor({ name, subsystem }: { name?: string, subsystem?: SubsystemRef }) {
    this.name = name;
    this.subsystem = subsystem;

    this.uuid = uuidV4();
  }
}

export class SubsystemActionInvocation {
  /**
   * The action to invoke.
   */
  action: SubsystemAction;

  /**
   * The arguments passed to the invocation. These must match with the action's declared params.
   */
  args: Arg[];
}

export class SubsystemState {
  /**
   * The name of the state.  This should be unique among all states on the subsystem.
   */
  name: string;

  uuid: string;

  subsystem: SubsystemRef;

  constructor({ name, subsystem }: { name?: string, subsystem?: SubsystemRef }) {
    this.name = name;
    this.subsystem = subsystem;

    this.uuid = uuidV4();
  }
}

export class Subsystem {
  /**
   * The name of the subsystem.
   */
  name: string;

  uuid: string;

  /**
   * The possible actions the subsystem can perform.
   */
  actions: SubsystemAction[];

  /**
   * The possible states that the subsystem exposes to commands.
   */
  states: SubsystemState[];

  constructor() {
    this.uuid = uuidV4();
    this.actions = [];
    this.states = [];
  }

  addAction(action: SubsystemAction) {
    if (action.subsystem !== this.uuid) return;

    this.actions.push(action);
  }

  addState(state: SubsystemState) {
    if (state.subsystem !== this.uuid) return;

    this.states.push(state);
  }

  createAction(name: string): SubsystemAction {
    const action = new SubsystemAction({ name: name, subsystem: this.uuid });
    this.addAction(action);
    return action;
  }

  createState(name: string): SubsystemState {
    const state = new SubsystemState({ name: name, subsystem: this.uuid });
    this.addState(state);
    return state;
  }
}

/**
 * Marks the end condition for a command. This could be "immediate", if the command should only execute once;
 * "none", if the command should never end naturally; or any State
 */
export type EndCondition =
  | "immediate"
  | "none"
  | { state: SubsystemState };

export type Command =
  | AtomicCommand
  | SequentialGroup
  | ParallelGroup;

type SubsystemRef = string;

/**
 * An atomic command performs a single subsystem action until some state is reached
 */
export class AtomicCommand {
  /**
   * The name of the command.
   */
  name: string;

  uuid: string;

  type: "Atomic";

  constructor() {
    this.uuid = uuidV4();
    this.type = "Atomic";
  }

  /**
   * The subsystem that the command manipulates.
   */
  subsystem: SubsystemRef;

  /**
   * The action that the command will execute.
   */
  action: SubsystemAction;

  /**
   * The end condition for the command.
   */
  endCondition: EndCondition;
}

/**
 * Sequential command group - runs all commands in the group in sequential order.
 */
export class SequentialGroup {
  name: string;
  uuid: string;
  commands: UUID[];
  type: "SequentialGroup";

  constructor() {
    this.uuid = uuidV4();
    this.commands = [];
    this.type = "SequentialGroup";
  }

  addCommand(command: Command) {
    this.commands.push(command.uuid);
  }
}

type ParallelEndCondition =
  "any" |
  "all" |
  UUID;

export class ParallelGroup {
  name: string;
  uuid: string;
  commands: UUID[];
  endCondition: ParallelEndCondition;
  type: "ParallelGroup";

  constructor() {
    this.uuid = uuidV4();
    this.endCondition = "any";
    this.commands = [];
    this.type = "ParallelGroup";
  }

  addCommand(command: Command) {
    this.commands.push(command.uuid);
  }
}
