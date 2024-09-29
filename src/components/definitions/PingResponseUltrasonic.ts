import { ComponentDefinition } from "../ComponentDefinition"

export const DIO_ULTRASONIC: ComponentDefinition = {
  id: "SAMPLE-pingresponseultrasonic",
  name: "Ping Response Ultrasonic",
  description: "An ultrasonic sensor that reports distance using 2 pwm connections",
  fqn: "edu.wpi.first.wpilibj.Ultrasonic;",
  className: "Ultrasonic",
  wpilibApiTypes: ["Ultrasonic"],
  type: "sensor",
  hints: [],
  methods: [
    {
      name: "Get Heading",
      description: "Gets the current angle of the gyro, where 0 is the angle it was at when last reset",
      codeName: "getAngle",
      returns: "double",
      parameters: [],
      hints: [ "controller-setpoint"],
    },
  ],
  properties: [
    {
      name: "DIO  Port",
      description: "The analog port the gyro is plugged into on the RoboRIO",
      codeName: "channel",
      type: "int",
      setInConstructor: true,
    },
  ],
}
