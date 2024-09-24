import { ComponentDefinition } from "../ComponentDefinition"

export const QUADRATURE_ENCODER: ComponentDefinition = {
  id: "SAMPLE-quadratureencoder",
  name: "Quadrature Encoder",
  description: "Measures the rotation of a shaft. Velocities are measured accurately, but displacement is relative to when the encoder started measuring - either robot boot or the last call to Reset",
  fqn: "edu.wpi.first.wpilibj.Encoder",
  className: "Encoder",
  wpilibApiTypes: [],
  type: "sensor",
  hints: ["state"],
  properties: [
    {
      name: "Channel A",
      codeName: "channelA",
      type: "int",
      description: "The digital input channel for the A channel",
      setInConstructor: true,
    },
    {
      name: "Channel B",
      codeName: "channelB",
      type: "int",
      description: "The digital input channel for the B channel",
      setInConstructor: true,
    },
    {
      name: "Reversed",
      codeName: "reverse",
      type: "boolean",
      description: "Flags the encoder as reversed so that 'forward' motion is indicated by positive values, however you choose to define 'forward'",
      setInConstructor: false, // optional parameter, and we have a setter...
      setter: {
        name: "Set Reversed",
        codeName: "setReverseDirection",
        description: "Flags the encoder as reversed so that 'forward' motion is indicated by positive values, however you choose to define 'forward'",
        hints: ["housekeeping"],
        parameters: [
          {
            name: "Reversed",
            codeName: "reverseDirection",
            type: "boolean",
            description: "", // eh, seems redundant
          },
        ],
        returns: "void",
      },
    },
    {
      name: "Distance per Pulse",
      codeName: "distancePerPulse",
      type: "double",
      description: "How far the mechanism moves per encoder pulse. \
                    This is a unitless value and can represent either linear or rotational distance. \
                    It is up to you, the programmer, to keep track of the units",
      setInConstructor: false,
      setter: {
        name: "Set Distance per Pulse",
        codeName: "setDistancePerPulse",
        description: "Sets how far the mechanism moves per encoder pulse",
        hints: ["configuration"],
        parameters: [
          {
            name: "Distance per Pulse",
            codeName: "distancePerPulse",
            type: "double",
            description: "",
          },
        ],
        returns: "void",
      },
    },
  ],
  methods: [
    {
      name: "Get Count",
      codeName: "get",
      description: "Gets the current encoder count from the sensor",
      hints: ["state"],
      parameters: [],
      returns: "int",
    },
    {
      name: "Reset Count",
      codeName: "reset",
      description: "Resets the current count to zero",
      hints: ["housekeeping"],
      parameters: [],
      returns: "void",
    },
    {
      name: "Get Distance",
      codeName: "getDistance",
      description: "Gets the travelled distance of the encoder since the last reset. Distance units are based on the value set for Distance per Pulse, or raw encoder units if it was not set.",
      hints: ["state"],
      parameters: [],
      returns: "double",
    },
    {
      name: "Get Rate",
      codeName: "getRate",
      description: "Gets the current velocity of the encoder. Returns in units of distance per second, where the distance unit depends on what you set for Distance per Pulse. If that was not set, distance units are raw encoder ticks.",
      hints: ["state"],
      parameters: [],
      returns: "double",
    },
    {
      name: "Stopped",
      codeName: "getStopped",
      description: "Checks if the encoder has stopped moving",
      hints: ["state"],
      parameters: [],
      returns: "boolean",
    },
  ],
}
