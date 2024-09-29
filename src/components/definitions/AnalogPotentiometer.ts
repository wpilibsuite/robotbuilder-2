import { ComponentDefinition } from "../ComponentDefinition"

export const ANALOG_POTENTIOMETER: ComponentDefinition = {
  id: "SAMPLE-analogpotentiometer",
  name: "Analog Potentiometer",
  description: "A sensor that measures rotation or position by converting it into an analog voltage proportional to the angle of the potentiometer.",
  fqn: "edu.wpi.first.wpilibj.AnalogPotentiometer",
  className: "AnalogPotentiometer",
  wpilibApiTypes: ["AnalogInput"],
  type: "sensor",
  hints: ["state", "control"],
  methods: [
    {
      name: "Get Position",
      description: "Gets the current position of the potentiometer, which can be mapped to a specific range.",
      codeName: "get",
      returns: "double",
      parameters: [],
      hints: ["state", "controller-setpoint"],
    },
  ],
  properties: [
    {
      name: "Analog Channel",
      description: "The analog input channel where the potentiometer is connected on the RoboRIO.",
      codeName: "channel",
      type: "int",
      setInConstructor: true,
    },
    {
      name: "Full Range",
      description: "The full range of the potentiometer, which determines the scaling factor for the analog voltage.",
      codeName: "fullRange",
      type: "double",
      setInConstructor: false,
      defaultValue: "1.0",
    },
    {
      name: "Offset",
      description: "The offset applied to the potentiometer reading to account for the starting position.",
      codeName: "offset",
      type: "double",
      setInConstructor: false,
      defaultValue: "0.0",
    },
  ],
  templates: {
    actions: [
      {
        name: "Measure Position",
        description: "Measures the current position using the analog potentiometer.",
        params: [],
        steps: [
          {
            type: "method-call",
            target: "this",
            methodName: "get",
            params: [],
          },
        ],
      },
    ],
  },
}
