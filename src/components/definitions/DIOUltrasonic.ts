import { ComponentDefinition } from "../ComponentDefinition"

export const DIO_ULTRASONIC: ComponentDefinition = {
  id: "SAMPLE-ultrasonic",
  name: "DIO Ultrasonic Sensor",
  description: "A sensor that uses sound waves to measure distance by calculating the time it takes for the sound wave to return.",
  fqn: "edu.wpi.first.wpilibj.Ultrasonic",
  className: "Ultrasonic",
  wpilibApiTypes: ["DistanceSensor"],
  type: "sensor",
  hints: ["state", "control"],
  methods: [
    {
      name: "Get Distance",
      description: "Gets the current distance measured by the ultrasonic sensor in inches.",
      codeName: "getRangeInches",
      returns: "double",
      parameters: [],
      hints: ["state", "controller-setpoint"],
    },
    {
      name: "Is Range Valid",
      description: "Checks if the current reading from the sensor is valid.",
      codeName: "isRangeValid",
      returns: "boolean",
      parameters: [],
      hints: ["state"],
    },
    {
      name: "Set Automatic Mode",
      description: "Sets whether the sensor should automatically ping and get readings. This should be enabled in most use cases.",
      codeName: "setAutomaticMode",
      returns: "void",
      parameters: [
        {
          name: "Enable",
          type: "boolean",
          codeName: "enable",
          description: "Whether to enable automatic mode for sensor readings.",
        },
      ],
      hints: ["control"],
    },
  ],
  properties: [
    {
      name: "Ping Channel",
      description: "The digital output channel used to ping the ultrasonic sensor.",
      codeName: "pingChannel",
      type: "int",
      setInConstructor: true,
    },
    {
      name: "Echo Channel",
      description: "The digital input channel used to receive the echo from the ultrasonic sensor.",
      codeName: "echoChannel",
      type: "int",
      setInConstructor: true,
    },
  ],
}
