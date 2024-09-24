import { ComponentDefinition } from "../ComponentDefinition"

export const MOTOR_CONTROLLER_GROUP: ComponentDefinition = {
  id: "SAMPLE-motorcontrollergroup",
  name: "Motor Controller Group",
  description: "Aggregates multiple motor controllers together so they can be controlled as a single entity. Useful for gearboxes or other groups of mechanically linked motors.",
  fqn: "edu.wpi.first.wpilibj.MotorControllerGroup",
  className: "MotorControllerGroup",
  type: "actuator",
  wpilibApiTypes: ["MotorController"],
  hints: ["action"],
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
  ],
  properties: [
    {
      name: "Motors",
      description: "The motors to group together",
      codeName: "motors",
      type: "vararg MotorController",
      setInConstructor: true,
    },
  ],
}
