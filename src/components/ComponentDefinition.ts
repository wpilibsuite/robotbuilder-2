export type ComponentType =
  "sensor" |
  "actuator" |
  "control";

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
}

export type Property = {
  name: string;
  codeName: string;
  type: string;
  setInConstructor: boolean;
  setter?: MethodDefinition;
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

  optional?: boolean;

  /**
   * Optional tags to use to improve suggestion for user-defined parameter names on custom actions.
   * One-to-one matches will be prioritized, as long as the types also line up.
   */
  tags?: string[];
}


export const Encoder: ComponentDefinition = {
  name: "Encoder",
  fqn: "edu.wpi.first.wpilibj.Encoder",
  className: "Encoder",
  hints: ["state"],
  properties: [
    {
      name: "Channel A",
      codeName: "channelA",
      type: "int",
      setter: null,
      getter: null,
      setInConstructor: true
    },
    {
      name: "Channel B",
      codeName: "channelB",
      type: "int",
      setter: null,
      getter: null,
      setInConstructor: true
    },
    {
      name: "Reverse direction",
      codeName: "reverseDirection",
      type: "boolean",
      setter: null,
      getter: null,
      setInConstructor: true
    },
    {
      name: "Encoding type",
      codeName: "encodingType",
      type: [
        { name: "Rising edge (1 channel)", fqn: "edu.wpi.first.wpilibj.CounterBase.IndexingType.k1X" },
        { name: "Rising and falling edges (1 channel)", fqn: "edu.wpi.first.wpilibj.CounterBase.IndexingType.k2X" },
        { name: "Rising and falling edges (2 channels)", fqn: "edu.wpi.first.wpilibj.CounterBase.IndexingType.k4X" }
      ],
      setter: null,
      getter: null,
      setInConstructor: true
    },
    {
      name: "Distance per pulse",
      codeName: "distancePerPulse",
      type: "double",
      setter: {
        name: "setDistancePerPulse",
        parameters: [
          {
            name: "distancePerPulse",
            type: "double",
            tags: []
          }
        ],
        hints: [],
        returns: "void",
      },
      getter: null,
      setInConstructor: false
    }
  ],
  methods: [
    {
      name: "get",
      returns: "double",
      hints: ["state", "binding"],
      parameters: []
    },
    {
      name: "getDistance",
      returns: "double",
      hints: ["state", "binding"],
      parameters: []
    },
    {
      name: "getRate",
      returns: "double",
      hints: ["state", "binding"],
      parameters: []
    },
    {
      name: "getStopped",
      returns: "boolean",
      hints: ["state"],
      parameters: []
    },
    {
      name: "reset",
      returns: "void",
      hints: ["housekeeping"],
      parameters: []
    }
  ]
}
