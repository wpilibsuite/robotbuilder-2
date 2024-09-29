import { ComponentDefinition } from "../ComponentDefinition"

export const DUTY_CYCLE_ENCODER: ComponentDefinition = {
  id: "SAMPLE-dutycycleencoder",
  name: "Duty Cycle Encoder",
  description: "A sensor that measures the position of a rotating mechanism using duty cycle-based input, providing a continuous absolute position.",
  fqn: "edu.wpi.first.wpilibj.DutyCycleEncoder",
  className: "DutyCycleEncoder",
  wpilibApiTypes: ["Encoder"],
  type: "sensor",
  hints: ["state", "control"],
  methods: [
    {
      name: "Get Distance",
      description: "Gets the distance the encoder has measured, accounting for any distance-per-pulse configuration.",
      codeName: "getDistance",
      returns: "double",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Get Absolute Position",
      description: "Gets the absolute position of the encoder between 0 and 1, where 1 represents a full rotation.",
      codeName: "getAbsolutePosition",
      returns: "double",
      parameters: [],
      hints: ["state", "controller-setpoint"],
    },
    {
      name: "Get Frequency",
      description: "Gets the frequency of the duty cycle signal in Hz.",
      codeName: "getFrequency",
      returns: "double",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Set Distance Per Rotation",
      description: "Sets the scale factor for converting duty cycle to meaningful distance (for example, degrees or inches).",
      codeName: "setDistancePerRotation",
      returns: "void",
      parameters: [
        {
          name: "Distance Per Rotation",
          type: "double",
          codeName: "distancePerRotation",
          description: "The conversion factor to apply for each full rotation of the encoder."
        }
      ],
      hints: ["state", "control"],
    },
    {
      name: "Reset",
      description: "Resets the encoder to zero distance.",
      codeName: "reset",
      returns: "void",
      parameters: [],
      hints: ["state"],
    }
  ],
  properties: [
    {
      name: "Digital Channel",
      description: "The digital input channel the encoder is connected to.",
      codeName: "channel",
      type: "int",
      setInConstructor: true,
    },
    {
      name: "Distance Per Rotation",
      description: "The scale factor used to convert duty cycle readings into meaningful distances.",
      codeName: "distancePerRotation",
      type: "double",
      setInConstructor: false,
      defaultValue: "1.0",
    },
  ],
}
