import { ComponentDefinition } from "../ComponentDefinition";

export const PID_CONTROLLER: ComponentDefinition = {
  id: "SAMPLE-pidcontroller",
  name: "PID Controller",
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
          tags: []
        }
      ],
      returns: "double"
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
          tags: ["controller-setpoint"]
        }
      ],
      returns: "void"
    },
    {
      name: "Reset",
      description: "Resets the controller and its internal state.  Use this when changing the setpoint, or if the calculate method may not have been called in a while",
      codeName: "reset",
      hints: ["housekeeping"],
      parameters: [],
      returns: "void"
    },
    {
      name: "Reached Setpoint",
      description: "Checks if the controller has reached the setpoint",
      codeName: "atSetpoint",
      hints: ["state"],
      parameters: [],
      returns: "boolean"
    }
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
            tags: []
          }
        ]
      }
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
            tags: []
          }
        ]
      }
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
            tags: []
          }
        ]
      }
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
            tags: []
          }
        ]
      }
    }
  ]
}