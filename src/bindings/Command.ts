import { v4 as uuidV4 } from "uuid"
import { ComponentDefinition } from "../components/ComponentDefinition.ts";

/**
 * The possible types that can be passed as arguments to an action invocation.
 */
export type ParamType =
  | "int"
  | "long"
  | "double"
  | "boolean"
  | string;

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

  static create(name: string, type: ParamType): Param {
    const param = new Param();
    param.name = name;
    param.type = type;
    return param;
  }

  createArg() {
    const arg = new Arg();
    arg.param = this.uuid;
    return arg;
  }
}

/**
 * An argument that may be passed to a subsystem action.
 */
export class Arg {
  param: UUID; // UUID of the param it's binding to

  /**
   * "passed-value" -> the method that calls the method this arg is bound to must provide a param to pass through
   *  { param: { name: "x", type: "double" }, type: "passed-value" } ->
   *    public void foo(double x) { bar(x); }
   *
   * "passed-supplier" -> the method that call the method this arg is bound to must provide a param to set a value supplier with
   *  { param: { name: "x", type: "double" }, type: "passed-supplier } ->
   *    public void foo(DoubleSupplier x) { bar(x.getAsDouble()); }
   *
   * "hardcoded" -> a hardcoded value is set, which may be refactored into a class-level constant.
   *                The hardcoded value is stored in `templatedValue`
   *  { param: { name: "x", type: "double" }, type: "hardcoded", templatedValue: "42" } ->
   *    public void foo() { bar(42); }
   *
   * "templated" -> arbitrary code provided by the user.  The value is stored in `templatedValue`
   *  { param: { name: "x", type: "double" }, type: "templated", templatedValue: "System.currentTimeMillis() / 1e3" } ->
   *    public void foo() { bar(System.currentTimeMillis() / 1e3); }
   */
  type: "passed-value" | "passed-supplier" | "hardcoded" | "templated" = "passed-value";

  templatedValue?: string;

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

  constructor(name?: string, subsystem?: SubsystemRef) {
    this.name = name;
    this.subsystem = subsystem;

    this.uuid = uuidV4();
    this.params = [];
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

  constructor(name?: string, subsystem?: string) {
    this.name = name;
    this.subsystem = subsystem;

    this.uuid = uuidV4();
  }
}

type SubsystemType = "sensor" | "actuator" | "control";

export class SubsystemComponent {
  name: string;
  readonly type: SubsystemType;
  readonly uuid: UUID = uuidV4();
  readonly definition: ComponentDefinition;
  readonly properties: object;

  constructor(name: string, definition: ComponentDefinition, properties: object) {
    this.uuid = uuidV4();

    this.name = name;
    this.definition = definition;
    this.properties = properties;
    this.type = this.definition.type;
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

  /**
   * The UUIDs of all the atomic commands that require this subsystem.
   */
  commands: AtomicCommand[];

  components: SubsystemComponent[];

  constructor() {
    this.uuid = uuidV4();
    this.actions = [];
    this.states = [];
    this.commands = [];
    this.components = [];
  }

  addAction(action: SubsystemAction) {
    if (action.subsystem !== this.uuid) return;

    this.actions.push(action);
  }

  addState(state: SubsystemState) {
    if (state.subsystem !== this.uuid) return;

    this.states.push(state);
  }

  public createAction(name: string): SubsystemAction {
    const action = new SubsystemAction(name, this.uuid);
    this.addAction(action);
    return action;
  }

  public createState(name: string): SubsystemState {
    const state = new SubsystemState(name, this.uuid);
    this.addState(state);
    return state;
  }

  public createCommand(name: string, action: SubsystemAction, endCondition: EndCondition): AtomicCommand {
    const command = new AtomicCommand();
    command.name = name;
    command.subsystem = this.uuid;
    command.action = action.uuid;
    command.endCondition = endCondition;
    this.commands.push(command);
    return command;
  }

  public getSensors() {
    return this.components.filter(c => c.type === "sensor");
  }

  public getActuators() {
    return this.components.filter(c => c.type === "actuator");
  }

  public getControls() {
    return this.components.filter(c => c.type === "control");
  }
}

/**
 * Marks the end condition for a command. This could be "immediate", if the command should only execute once;
 * "none", if the command should never end naturally; or any State
 */
export type EndCondition =
  | "forever" // command runs until interrupted
  | "once" // command runs exactly once, then finishes
  | UUID; // subsystem state uuid

export type Command =
  | AtomicCommand
  | SequentialGroup
  | ParallelGroup;

type SubsystemRef = UUID;

type ActionParamCallOptionInvocationType = "hardcode" | "passthrough-value" | "passthrough-supplier";
export class ActionParamCallOption {

  action: UUID; // the action

  param: UUID; // the specific param on the action to configure

  invocationType: ActionParamCallOptionInvocationType = "hardcode";

  hardcodedValue?: string = null

  constructor(action: SubsystemAction, param: Param, invocationType: ActionParamCallOptionInvocationType, hardcodedValue: string = null) {
    this.action = action.uuid;
    this.param = param.uuid;
    this.invocationType = invocationType;
    this.hardcodedValue = hardcodedValue;
  }
}

/**
 * An atomic command performs a single subsystem action until some state is reached
 */
export class AtomicCommand {
  /**
   * The name of the command.
   */
  name: string;

  uuid: string;

  type: string = "Atomic";

  /**
   * The subsystem that the command manipulates.
   */
  subsystem: SubsystemRef;

  /**
   * The action that the command will execute.
   */
  action: UUID; // Subsystem action UUID

  /**
   * The end condition for the command.
   */
  endCondition: EndCondition;

  /**
   * Parameters required to build an instance of the command.
   */
  params: ActionParamCallOption[] = [];

  constructor() {
    this.uuid = uuidV4();
  }
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
