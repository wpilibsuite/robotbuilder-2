import { ComponentDefinition } from "../ComponentDefinition"

export const PID_CONTROLLER: ComponentDefinition = {
  id: "SAMPLE-pidcontroller",
  name: "PID Controller",
  description: 'A feedback controller that accepts the current state of a mechanism (such as the angle of an arm) and a desired position (the "setpoint") and calculates a motor output to move the mechanism closer to that setpoint.',
  fqn: "edu.wpi.first.math.controller.PIDController",
  className: "PIDController",
  wpilibApiTypes: [],
  type: "control",
  hints: ["action"],
  methods: [
    {
      name: "Calculate",
      description: "Calculates the output of the controller based on the current state of the system.  Requires the setpoint to have been set first.",
      codeName: "calculate",
      hints: ["action", "motor-input"],
      parameters: [
        {
          name: "Current Position",
          description: "The current position of the system",
          codeName: "measurement",
          type: "double",
          tags: [],
        },
      ],
      returns: "double",
    },
    {
      name: "Set Setpoint",
      description: "Configures the target setpoint for the controller to reach.  Use Calculate in an action to periodically update the output to get closer to the setpoint",
      codeName: "setSetpoint",
      hints: ["housekeeping"],
      beforeCalling: "reset",
      parameters: [
        {
          name: "Setpoint",
          description: "The setpoint to target",
          codeName: "setpoint",
          type: "double",
          tags: ["controller-setpoint"],
        },
      ],
      returns: "void",
    },
    {
      name: "Reset",
      description: "Resets the controller and its internal state.  Use this when changing the setpoint, or if the calculate method may not have been called in a while",
      codeName: "reset",
      hints: ["housekeeping"],
      parameters: [],
      returns: "void",
    },
    {
      name: "Reached Setpoint",
      description: "Checks if the controller has reached the setpoint",
      codeName: "atSetpoint",
      hints: ["state"],
      parameters: [],
      returns: "boolean",
    },
  ],
  properties: [
    {
      name: "Proportional Constant",
      description: "The constant value for the controller to use to determine a motor speed based on how far away the system is from the setpoint",
      codeName: "kp",
      type: "double",
      setInConstructor: true,
      setter: {
        name: "Set Proportional Constant",
        description: "",
        codeName: "setP",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Proportional Constant",
            description: "",
            codeName: "kp",
            type: "double",
            tags: [],
          },
        ],
      },
    },
    {
      name: "Integral Constant",
      description: "The constant value for the controller to use to determine a motor speed based on how long it's been off target.  Useful if the proportional constant get close to the setpoint, but not exactly.  Typically isn't used.",
      codeName: "ki",
      type: "double",
      setInConstructor: true,
      setter: {
        name: "Set Integral Constant",
        description: "",
        codeName: "setI",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Integral Constant",
            description: "",
            codeName: "ki",
            type: "double",
            tags: [],
          },
        ],
      },
    },
    {
      name: "Derivative Constant",
      description: "The constant value for the controller to use to slow motor speed based on how fast it's approaching the setpoint.  Useful to avoid overshoot and oscillations.",
      codeName: "kd",
      type: "double",
      setInConstructor: true,
      setter: {
        name: "Set Proportional Constant",
        description: "",
        codeName: "setD",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Derivative Constant",
            description: "",
            codeName: "kd",
            type: "double",
            tags: [],
          },
        ],
      },
    },
    {
      name: "Tolerance",
      description: "Sets the tolerance of the controller.  Increasing values mean `Reached Setpoint` will be true when the system is farther away from the target setpoint",
      codeName: "tolerance",
      type: "double",
      setInConstructor: false,
      setter: {
        name: "Set Tolerance",
        description: "",
        codeName: "setTolerance",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Tolerance",
            description: "",
            codeName: "tolerance",
            type: "double",
            tags: [],
          },
        ],
      },
    },
  ],
  templates: {
    actions: [
      {
        name: "Reset $self",
        description: "Resets the internal state of $self. Use this when changing setpoints.",
        params: [],
        steps: [
          {
            target: "$self",
            type: "method-call",
            methodName: "reset",
            params: [],
          },
        ],
      },
      {
        name: "Set $self Target",
        description: "Sets the target setpoint for $self. Calling the calculate method on $self after this will output values to control the mechanism to reach the target.",
        params: [
          {
            name: "target",
            type: "double",
          },
        ],
        steps: [
          {
            target: "$self",
            type: "method-call",
            methodName: "reset",
            params: [],
          },
          {
            target: "$self",
            type: "method-call",
            methodName: "setSetpoint",
            params: [
              {
                paramName: "setpoint",
                arg: {
                  type: "define-passthrough-value",
                  passthroughArgumentName: "target",
                },
              },
            ],
          },
        ],
      },
    ],
    states: [
      {
        name: "$self At Target",
        description: "Checks if $self has reached the last known setpoint, within the tolerance bound. Setting a nonzero tolerance is highly recommended.",
        step: {
          type: "method-call",
          target: "$self",
          methodName: "atSetpoint",
          params: [],
        },
      },
    ],
    commands: [

    ],
  },
}
