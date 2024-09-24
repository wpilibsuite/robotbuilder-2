import { v4 as uuidV4 } from "uuid"
import { ComponentDefinition } from "../components/ComponentDefinition";

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

  uuid: UUID;

  subsystem: SubsystemRef;

  /**
   * The parameters available to be passed to the action. This may be empty.
   */
  params: Param[];

  steps: SubsystemActionStep[]

  constructor(name?: string, subsystem?: SubsystemRef) {
    this.name = name;
    this.subsystem = subsystem;

    this.uuid = uuidV4();
    this.params = [];
    this.steps = [];
  }

  /**
   * Generates new param
   * @param subsystem
   */
  public generateParams(subsystem: Subsystem): Param[] {
    return this.steps.flatMap(step => {
      const component = subsystem.components.find(c => c.uuid === step.component);
      const method = component.definition.methods.find(m => m.codeName === step.methodName);
      console.debug('[GENERATE-PARAMS] Generating param for method', step.methodName, 'on', component);

      return step.params.flatMap(stepParam => {
        const parameterDefinition = method.parameters.find(p => p.codeName === stepParam.paramName);
        if (stepParam.arg.type === "define-passthrough-value") {
          const existingParam = this.params.find(p => p.name === stepParam.paramName);
          if (existingParam) {
            // No changes
            console.debug('[GENERATE-PARAMS] Found existing param for', stepParam.paramName, '- skipping regeneration', existingParam);
            return [existingParam];
          } else {
            const newParam = Param.create(stepParam.arg.passthroughArgumentName, parameterDefinition.type);
            console.debug('[GENERATE-PARAMS] Did not find an existing param for', stepParam.paramName, 'in', this.params, '- generated new param:', newParam);
            return [newParam];
          }
        } else {
          // The param on the step is hardcoded or references the output of another step, we don't need to bubble up another param
          console.debug('[GENERATE-PARAMS] Param', stepParam.paramName, 'does not bubble up to the action definition because its arg type is', stepParam.arg.type);
          return [];
        }
      })
    });
  }

  public regenerateParams(subsystem: Subsystem): Param[] {
    this.params = this.generateParams(subsystem);
    return this.params;
  }
}

export type StepParam = {
  /**
   * The name of the code param on the method invoked by the step.
   */
  paramName: string;

  arg: StepArgument;
}

export type HardcodedStepArgument = {
  type: "hardcode";
  hardcodedValue: string;
}

export type PassthroughValueStepArgument = {
  type: "define-passthrough-value";

  /**
   * The name of the argument to define on the step's method signature.
   */
  passthroughArgumentName: string;
}

export type ReferencePassthroughValueStepArgument = {
  type: "reference-passthrough-value";

  /**
   * The UUID of the step that defined the value we're referencing.
   */
  step: UUID;

  /**
   * The name of the parameter on the called method.  Using this because the passthrough parameter name
   * may change, and it's simpler to reference the immutable name of the parameter on the called method
   */
  paramName: string;
}

export type ReferencePreviousOutputStepArgument = {
  type: "reference-step-output",
  step: UUID
};

export type StepArgument =
  HardcodedStepArgument |
  PassthroughValueStepArgument |
  ReferencePassthroughValueStepArgument |
  ReferencePreviousOutputStepArgument;

/**
 * A single step in an action.
 * A step involves executing a single method from a component in the subsystem and saving its output.
 * Parameters to the executed method may be hardcoded, reference a method argument (which may be defined by a previous
 * step), or reference the output of a previous step.
 */
export class SubsystemActionStep {
  /**
   * The UUID of the step.  May be referenced by later steps in the same action to define an input argument to that
   * step's method.
   */
  uuid: UUID = uuidV4();

  /**
   * The UUID of the component upon which to invoke a method.
   */
  component: UUID;

  /**
   * The name of the method to invoke.
   */
  methodName: string;

  params: StepParam[] = [];

  constructor(props) {
    if (Object.hasOwn(props, 'uuid')) {
      this.uuid = props.uuid;
    }
    this.component = props.component;
    this.methodName = props.methodName;
    if (Object.hasOwn(props, 'params')) {
      this.params = [...props.params];
    }
  }

  public clone(): SubsystemActionStep {
    return new SubsystemActionStep({
      uuid: this.uuid,
      component: this.component,
      methodName: this.methodName,
      params: this.params.map(p => ({ ...p }))
    });
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

  uuid: UUID;

  subsystem: SubsystemRef;

  step: SubsystemActionStep;

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
  definition: ComponentDefinition;
  properties: object;

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

  uuid: string = uuidV4();

  /**
   * The possible actions the subsystem can perform.
   */
  actions: SubsystemAction[] = [];

  /**
   * The possible states that the subsystem exposes to commands.
   */
  states: SubsystemState[] = [];

  /**
   * The UUIDs of all the atomic commands that require this subsystem.
   */
  commands: AtomicCommand[] = [];

  components: SubsystemComponent[] = [];

  ioLayer: boolean = true;

  constructor() {
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

  public getSensors(): SubsystemComponent[] {
    return this.components.filter(c => c.type === "sensor");
  }

  public getActuators(): SubsystemComponent[] {
    return this.components.filter(c => c.type === "actuator");
  }

  public getControls(): SubsystemComponent[] {
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

type SubsystemRef = UUID;

export type ActionParamCallOptionInvocationType = "hardcode" | "passthrough-value" | "passthrough-supplier";
export class ActionParamCallOption {

  action: UUID; // the action

  uuid: UUID = uuidV4();

  name: string;

  param: UUID; // the specific param on the action to configure

  invocationType: ActionParamCallOptionInvocationType = "hardcode";

  hardcodedValue?: string = null

  constructor(action: UUID, param: UUID, name: string, invocationType: ActionParamCallOptionInvocationType, hardcodedValue: string = null) {
    this.action = action;
    this.param = param;
    this.name = name;
    this.invocationType = invocationType;
    this.hardcodedValue = hardcodedValue;
  }

  static fromObjects(action: SubsystemAction, param: Param, invocationType: ActionParamCallOptionInvocationType, hardcodedValue: string = null) {
    return new ActionParamCallOption(action.uuid, param.uuid, param.name, invocationType, hardcodedValue)
  }
}

/**
 * A parameter invocation to pass to a specific parameter when invoking a command from a command group.
 */
export type CommandParamInvocation = {
  /**
   * The command that holds the param.
   */
  command: UUID;

  /**
   * The ID of the invocation.
   */
  uuid: UUID;

  /**
   * The ID of the param being configured
   */
  param: UUID;

  /**
   * The name of the param as declared in the command's signature. Only used when the invocation type is a pass-through.
   */
  name: string;

  paramType: ParamType;

  /**
   * How the param should be invoked.
   */
  invocationType: ActionParamCallOptionInvocationType;

  /**
   * The hardcoded value.
   */
  hardcodedValue?: string;
}

/**
 * A command invocation is a reference to a specific command and a list of parameters to pass to that command
 * when invoked.
 *
 * @example
 *    A command invocation that looks like { command: "some-command-uuid", params: [{ }] }
 */
export type CommandInvocation = {
  /**
   * The command being invoked.
   */
  command: Command | UUID;

  /**
   * Invocations for all the parameters on the command.
   */
  params: CommandParamInvocation[];
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

  type: "Atomic";

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
  toInitialize: UUID[] = [];

  toComplete: UUID[] = [];

  toInterrupt: UUID[] = [];

  constructor() {
    this.uuid = uuidV4();
    this.type = "Atomic";
  }

  public callsAction(action: SubsystemAction): boolean {
    const uuid = action.uuid;
    return this.action === uuid ||
      this.toInterrupt.includes(uuid) ||
      this.toComplete.includes(uuid) ||
      this.toInterrupt.includes(uuid);
  }

  requirements() {
    return [this.subsystem];
  }

  usedSubsystems(): SubsystemRef[] {
    return [this.subsystem];
  }

  runsCommand(command: string): boolean {
    return command === this.uuid;
  }
}
