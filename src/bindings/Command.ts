/**
 * The possible primitive types that can be passed as arguments to an action invocation.
 */
export type ParamType =
  | "int"
  | "long"
  | "double"
  | "boolean";

export type Unit = { name: string, symbol: string };

/**
 * A single parameter to a subsystem action.
 */
export class Param {
  /**
   * The name of the parameter.
   */
  name: string;

  /**
   * The type of the parameter.
   */
  type: ParamType;

  /**
   * Optional: a physical unit for the parameter (eg "feet" or "inches"). Useful to have as annotations, and can be used
   * by C++ to encode units in the type system.
   */
  unit?: Unit;
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

  /**
   * The parameters available to be passed to the action. This may be empty.
   */
  params: Param[];
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
}

export class Subsystem {
  /**
   * The name of the subsystem.
   */
  name: string;

  /**
   * The possible actions the subsystem can perform.
   */
  actions: SubsystemAction[];

  /**
   * The possible states that the subsystem exposes to commands.
   */
  states: SubsystemState[];
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
  | DeadlineGroup
  | RaceGroup
  | ParallelGroup;

/**
 * An atomic command performs a single subsystem action until some state is reached
 */
export class AtomicCommand {
  /**
   * The name of the command.
   */
  name: string;

  uuid: string;

  /**
   * The subsystem that the command manipulates.
   */
  subsystem: Subsystem;

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
  commands: Command[];

  addCommand(command: Command) {
    this.commands.push(command);
  }
}

/**
 * A group of commands that run in parallel; the group will terminate only when the leader command finishes. Any other
 * running commands will be cancelled.
 */
export class DeadlineGroup {
  name: string;

  uuid: string;
  /**
   * The commands that will race.
   */
  commands: Command[];

  /**
   * The race leader. Once this command finishes, all other running commands will be cancelled.
   */
  leader: Command;

  addCommand(command: Command) {
    this.commands.push(command);
  }
}

/**
 * A group of commands that run in parallel; the group will terminate when ANY of the commands it encapsulates finishes.
 */
export class RaceGroup {
  name: string;

  uuid: string;
  /**
   * The commands that will race.
   */
  commands: Command[];

  addCommand(command: Command) {
    this.commands.push(command);
  }
}

/**
 * A group of commands that run in parallel; the group will terminate only when ALL encapsulated commands finish.
 */
export class ParallelGroup {
  name: string;

  uuid: string;
  /**
   * The commands to run together.
   */
  commands: Command[];

  addCommand(command: Command) {
    this.commands.push(command);
  }
}
