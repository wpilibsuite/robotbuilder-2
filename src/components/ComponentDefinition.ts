import { ActionParamCallOptionInvocationType, StepParam } from "../bindings/Command";

export type ComponentType =
  "sensor" |
  "actuator" |
  "control";

type Templates = {
  states?: StateTemplate[];
  actions: ActionTemplate[];
  commands?: CommandTemplate[];
}

type ParameterTemplate = {
  name: string;
  type: string;
}

type StepTemplate =
  MethodCallStepTemplate;

type MethodCallStepTemplate = {
  type: "method-call";
  target: string;
  methodName: string;
  params: StepParam[];
}

export type StateTemplate = {
  name: string;
  description?: string;
}

export type ActionTemplate = {
  /**
   * The name of the action to generate.
   */
  name: string;

  /**
   * A description of the action and how it can be used.  This may be included in generated code documentation.
   */
  description?: string;

  /**
   * The parameters to the action method.
   */
  params: ParameterTemplate[];

  /**
   * The steps for the action to execute.
   */
  steps: StepTemplate[];
}

type ActionInvocationTemplate = {
  /**
   * The name of the action to invoke.
   */
  actionName: string;

  params: ActionParamCallOptionTemplate[];
}

type ActionParamCallOptionTemplate = {
  paramName: string;
  invocationType: ActionParamCallOptionInvocationType;
  hardcodedValue?: string;
}

export type CommandTemplate = {
  /**
   * The name of the command to generate
   */
  name: string;

  /**
   * A description of what the command does.
   */
  description?: string;

  /**
   * The names of the actions to invoke for command initialization.
   * Available actions are limited to the ones defined by the `actions` templates.
   */
  toInitialize: ActionInvocationTemplate[];

  /**
   * The name of the action to invoke for command execution.
   * Available actions are limited to the ones defined by the `actions` templates.
   */
  toExecute: ActionInvocationTemplate;

  // TODO: toComplete/toInterrupt

  /**
   * The end condition of the generated command.  This can be "once" for an InstantCommand,
   * "forever" for a command that runs until interrupted or canceled, or the name of a state. Available states
   * are limited to the ones defined by the `states` templates.
   */
  endCondition: "once" | "forever" | string;
}

export type ComponentDefinition = {
  /**
   * A unique identifier to represent this definition.  It's encouraged to version the identifier to make
   * API-incompatible versions of the definition distinct.
   */
  id: string;

  /**
   * The human-readable name of the component.
   */
  name: string;

  /**
   * The fully-qualified domain name for the Java class that represents the component.
   */
  fqn: string;

  /**
   * The name of the Java class that represents the component.  This is equal to `fqn.split('.').lastItem`
   */
  className: string;

  /**
   * The WPILib API types the component matches.  For example, a TalonSRX includes the "MotorController" API
   * type since it inherits from that type.
   */
  wpilibApiTypes: string[];

  /**
   * The type of component (sensor, actuator, or controller/"plant").
   */
  type: ComponentType;

  /**
   * The different parts of a command lifecycle to provide hints for.  Components that hint at compatibility with
   * a particular lifecycle will be suggested more prominently for implementation behavior.
   */
  hints: string[];

  properties: Property[];

  /**
   * The methods provided by the component.  NOTE: this doesn't have to be EVERY method - just the ones useful for
   * commands.  Methods used for configuration reading and writing (such as PIDController's getP/setP,getI/setI/etc)
   * aren't necessary - though they should be used when constructing the component, if they're relevant to that task.
   */
  methods: MethodDefinition[];

  /**
   * An optional set of templates defined by the component.  When a new component is created with this definition,
   * the UI will prompt users to also generate the states, actions, and commands available in the templates. If
   * an action is opted out of, any commands that use that action will be made unavailable for templating.
   */
  templates?: Templates;
}

type ConstantRef = {
  /**
   * The human-readable name of the constant value.
   */
  name: string;
  /**
   * A description of the constant value.
   */
  description: string;
  /**
   * The name of the constant as it appears in code.
   */
  codeName: string;
}

export type Property = {
  /**
   * The name of the property in a human-readable format.
   */
  name: string;
  /**
   * A human-readable description of the property and what it configures.
   */
  description: string;
  /**
   * The name of the property as it appears in code.  Crucially, this MUST match the parameter name on either the
   * constructor or the setter method.
   */
  codeName: string;
  /**
   * The type of the property. This can be a primitive like "double", or the FULLY-QUALIFIED NAME of a class.
   * If the class is an enum, or otherwise defines a set of constant values as the only set of valid options that may
   * be set, define those options in the `options` array.
   */
  type: string;
  /**
   * A set of valid options that the property can be set to.
   */
  options?: ConstantRef[];
  /**
   * Flags the property as a required constructor argument.
   */
  setInConstructor: boolean;
  /**
   * The method to set this property outside the constructor, if such a method exists.
   */
  setter?: MethodDefinition;
  /**
   * The method to retrieve the value of this property.
   */
  getter?: MethodDefinition;
}

export type EnumDef = {
  name: string;
  fqn: string;
}

export type MethodDefinition = {
  /**
   * The name of the method.
   */
  name: string;

  codeName: string;

  /**
   * A description of the method and what it does, and how it's useful for a robot.
   */
  description: string;

  /**
   * The different parts of a command lifecycle to provide hints for.  Methods that hint at compatibility with
   * a particular lifecycle will be suggested more prominently for implementation behavior.
   */
  hints: string[];

  /**
   * The parameters of the method.  If a parameter matches with a parameter on a subsystem's action, then code
   * generation can detect that match and automatically pass the value through to the method call.
   */
  parameters: ParameterDefinition[];

  /**
   * The name of the return type of the method.  This can be used to determine if a method's output can be bound to
   * the input of another to build actions like "calculate a PID controller's output and feed it to a motor".
   * Custom classes should use the fully-qualified domain name, e.g. "edu.wpi.first.wpilibj.drive.DifferentialDrive.WheelSpeeds".
   * Code generation will clean it up and generate appropriate import statements.
   */
  returns: string;

  /**
   * If this method would be best run after performing some cleanup, list those cleanup methods here.  Mostly used
   * when multiple methods are tightly bound and should be run together in a command's initialize - for example,
   * resetting a PID controller before updating its setpoint.  The setpoint is assigned once in a command's initialize,
   * then the calculate() method is called repeatedly during the execute phase.
   */
  beforeCalling?: string | string[];
}

export type ParameterDefinition = {
  /**
   * The name of the parameter.
   */
  name: string;

  /**
   * The type of the parameter, e.g. "double" or "String".
   * Custom classes should use the fully-qualified domain name, e.g. "edu.wpi.first.wpilibj.drive.DifferentialDrive.WheelSpeeds".
   * Code generation will clean it up and generate appropriate import statements.
   */
  type: string;

  /**
   * The name of the parameter as it appears in code.
   */
  codeName: string;

  /**
   * A description of what the parameter is used for and what it controls.  This may be displayed in the UI to help
   * users know what each thing does.
   */
  description;

  optional?: boolean;

  /**
   * Optional tags to use to improve suggestion for user-defined parameter names on custom actions.
   * One-to-one matches will be prioritized, as long as the types also line up.
   */
  tags?: string[];
}
