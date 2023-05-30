import { ComponentDefinition } from "../ComponentDefinition";

export const ANALOG_GYRO: ComponentDefinition = {
  id: "SAMPLE-analoggyro",
  name: "Analog Gyroscope",
  fqn: "edu.wpi.first.wpilib.AnalogGyro",
  className: "AnalogGyro",
  wpilibApiTypes: ["Gyro"],
  type: "sensor",
  hints: ["state"],
  methods: [
    {
      name: "Get Heading",
      description: "Gets the current angle of the gyro, where 0 is the angle it was at when last reset",
      codeName: "getAngle",
      returns: "double",
      parameters: [],
      hints: ["state", "controller-setpoint"]
    }
  ],
  properties: [
    {
      name: "Analog Port",
      description: "The analog port the gyro is plugged into on the RoboRIO",
      codeName: "channel",
      type: "int",
      setInConstructor: true
    }
  ]
};
