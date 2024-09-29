import { ComponentDefinition } from "../ComponentDefinition"

export const ANALOG_ENCODER: ComponentDefinition = {
  id: "SAMPLE-analogencoder",
  name: "Analog Encoder",
  description: "An encoder that measures position by interpreting an analog voltage from a potentiometer or similar device, providing a continuous absolute position.",
  fqn: "edu.wpi.first.wpilibj.AnalogEncoder",
  className: "AnalogEncoder",
  wpilibApiTypes: ["Encoder"],
  type: "sensor",
  hints: ["state", "control"],
  methods: [
    {
      name: "Get Distance",
      description: "Gets the distance measured by the analog encoder, typically in units such as degrees or inches.",
      codeName: "getDistance",
      returns: "double",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Get Absolute Position",
      description: "Gets the absolute position of the analog encoder, scaled between 0 and 1.",
      codeName: "getAbsolutePosition",
      returns: "double",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Set Position Offset",
      description: "Sets the offset for the encoder's position to a known reference value.",
      codeName: "setPositionOffset",
      returns: "void",
      parameters: [
        {
          name: "Position Offset",
          type: "double",
          codeName: "offset",
          description: "The position offset to apply to the encoder, allowing for position calibration."
        }
      ],
      hints: ["control"],
    },
    {
      name: "Get Position Offset",
      description: "Gets the current position offset applied to the encoder.",
      codeName: "getPositionOffset",
      returns: "double",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Set Distance Per Rotation",
      description: "Sets the scale factor that converts encoder rotations to a meaningful distance, such as degrees or inches.",
      codeName: "setDistancePerRotation",
      returns: "void",
      parameters: [
        {
          name: "Distance Per Rotation",
          type: "double",
          codeName: "distancePerRotation",
          description: "The conversion factor applied for each rotation of the encoder."
        }
      ],
      hints: ["control"],
    },
    {
      name: "Get Distance Per Rotation",
      description: "Gets the currently set scale factor that converts encoder rotations to a meaningful distance.",
      codeName: "getDistancePerRotation",
      returns: "double",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Reset",
      description: "Resets the encoder to zero, clearing any accumulated position.",
      codeName: "reset",
      returns: "void",
      parameters: [],
      hints: ["state"],
    }
  ],
  properties: [
    {
      name: "Analog Input Channel",
      description: "The analog input channel on the RoboRIO that the encoder is connected to.",
      codeName: "channel",
      type: "int",
      setInConstructor: true,
    },
    {
      name: "Position Offset",
      description: "The offset applied to the position for calibration purposes.",
      codeName: "offset",
      type: "double",
      setInConstructor: false,
      defaultValue: "0.0",
    },
    {
      name: "Distance Per Rotation",
      description: "The scale factor applied for each full rotation of the encoder.",
      codeName: "distancePerRotation",
      type: "double",
      setInConstructor: false,
      defaultValue: "1.0",
    },
  ],
}
