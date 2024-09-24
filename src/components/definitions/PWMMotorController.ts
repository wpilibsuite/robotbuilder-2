import { ComponentDefinition } from "../ComponentDefinition"

export function PwmMotorController({ id, name, className, fqn }: { id: string, name: string, className: string, fqn: string }): ComponentDefinition {
  return {
    id: id,
    name: name,
    description: `Controls a physical motor using a ${ name } motor controller.`,
    type: "actuator",
    className: className,
    fqn: fqn,
    wpilibApiTypes: ["motorcontroller"],
    hints: ["action", "motor"],
    properties: [
      {
        name: "PWM Channel",
        codeName: "channel",
        type: "int",
        description: `The PWM Channel on the roboRIO that the ${ name } is plugged into.`,
        setInConstructor: true,
      },
      {
        name: "Inverted",
        codeName: "inverted",
        type: "boolean",
        description: "Whether the motor is inverted (clockwise-positive) or not (counterclockwise-positive)",
        setInConstructor: false,
        setter: {
          name: "Set Inverted",
          codeName: "setInverted",
          description: "Sets the motor to be inverted",
          hints: [],
          returns: "void",
          parameters: [
            {
              name: "Inverted",
              codeName: "inverted",
              description: "",
              type: "boolean",
            },
          ],
        },
      },
    ],
    methods: [
      {
        name: "Set Speed",
        description: "Sets the speed of the motor as a value from -1 for full reverse to +1 for full forward speed. The actual speed of the motor will depend on the torque load and the voltage supplied by the battery.",
        codeName: "set",
        hints: ["action", "motor-input"],
        parameters: [
          { name: "Speed", description: "", codeName: "speed", type: "double" },
        ],
        returns: "void",
      },
      {
        name: "Stop",
        description: "Stops the motor. Equivalent to setting the speed to 0",
        codeName: "stopMotor",
        hints: ["action"],
        parameters: [],
        returns: "void",
      },
    ],
  }
}
  
