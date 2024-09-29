import { ComponentDefinition } from "../ComponentDefinition"

export const DIGITAL_INPUT: ComponentDefinition = {
  id: "SAMPLE-digitalinput",
  name: "Digital Input",
  description: "A sensor that reads digital signals (either HIGH or LOW) from various devices, typically limit switches or encoders.",
  fqn: "edu.wpi.first.wpilibj.DigitalInput",
  className: "DigitalInput",
  wpilibApiTypes: ["DigitalInput"],
  type: "sensor",
  hints: ["state", "control"],
  methods: [
    {
      name: "Get",
      description: "Gets the current state of the digital input, either true (HIGH) or false (LOW).",
      codeName: "get",
      returns: "boolean",
      parameters: [],
      hints: ["state", "controller-setpoint"],
    },
    {
      name: "Get Channel",
      description: "Gets the channel number that the digital input is attached to.",
      codeName: "getChannel",
      returns: "int",
      parameters: [],
      hints: ["state"],
    },
  ],
  properties: [
    {
      name: "Digital Channel",
      description: "The digital input channel on the RoboRIO where the sensor is connected, typically in the range of 0-9.",
      codeName: "channel",
      type: "int",
      setInConstructor: true,
    },
  ],
}
