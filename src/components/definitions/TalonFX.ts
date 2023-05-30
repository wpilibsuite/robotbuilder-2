import { ComponentDefinition } from "../ComponentDefinition";

export const CAN_TALON_FX: ComponentDefinition = {
  id: "SAMPLE-cantalonfx",
  name: "Talon FX (CAN)",
  description: 'A CTRE-manufactured Talon FX controlled via a CAN bus',
  fqn: "com.ctre.phoenix.motorcontrol.can.WPI_TalonFX",
  className: "WPI_TalonFX",
  type: "actuator",
  wpilibApiTypes: ["MotorController"],
  hints: ["action", "motor"],
  methods: [
    {
      name: "Set Speed",
      description: "Sets the speed of the motor as a value from -1 for full reverse to +1 for full forward speed. The actual speed of the motor will depend on the torque load and the voltage supplied by the battery.",
      codeName: "set",
      hints: ["action", "motor-input"],
      parameters: [
        { name: "Speed", description: "", codeName: "speed", type: "double" }
      ],
      returns: "void"
    },
    {
      name: "Get Position",
      description: "Retrieves the current position of the integrated sensor, in raw sensor units.",
      codeName: "getSelectedSensorPosition",
      hints: ["state", "sensor-output"],
      parameters: [],
      returns: "double"
    },
    {
      name: "Get Velocity",
      description: "Retrieves the current velocity of the integrated sensor, in raw sensor units per 0.1 seconds.",
      codeName: "getSelectedSensorVelocity",
      hints: ["state", "sensor-output"],
      parameters: [],
      returns: "double"
    },
  ],
  properties: [
    {
      name: "CAN ID",
      description: "The ID of the Talon FX on the CAN bus.  This value is set by the Phoenix Tuner tool, and must be unique among ALL Talon FX devices on the bus.",
      codeName: "deviceNumber",
      type: "int",
      setInConstructor: true,
      getter: {
        name: "Get Device ID",
        description: "Gets the configured CAN ID for the Talon FX",
        codeName: "getDeviceID",
        hints: [],
        parameters: [],
        returns: "int"
      }
    },
    {
      name: "Sensor",
      description: "The integrated sensor",
      codeName: "selectedFeedbackSensor",
      type: "com.ctre.phoenix.motorcontrol.FeedbackDevice",
      options: [
        { name: "Quadrature Encoder", codeName: "FeedbackDevice.QuadEncoder", description: "" },
        { name: "Integrated Sensor", codeName: "FeedbackDevice.IntegratedSensor", description: "" },
        { name: "Analog Sensor", codeName: "FeedbackDevice.Analog", description: "An analog potentiometer or encoder plugged into the motor controller" },
        { name: "Tachometer", codeName: "FeedbackDevice.Tachometer", description: "" },
        { name: "PWM Encoded Position", codeName: "FeedbackDevice.PulseWidthEncodedPosition", description: "" },
        { name: "Built-in Encoder (Absolute Mode)", codeName: "FeedbackDevice.CTRE_MagEncoder_Absolute", description: "" },
        { name: "Built-in Encoder (Relative Mode)", codeName: "FeedbackDevice.CTRE_MagEncoder_Relative", description: "" },
        { name: "No Sensor", codeName: "FeedbackDevice.None", description: "No integrated sensor. Position and velocity readings will always return zero." }
      ],
      setInConstructor: false,
      setter: {
        name: "Set Selected Feedback Sensor",
        description: "Sets the selected feedback sensor",
        codeName: "configSelectedFeedbackSensor",
        returns: "void",
        hints: [],
        parameters: [
          {
            name: "Selected Feedback Device",
            description: "",
            codeName: "feedbackDevice",
            type: "com.ctre.phoenix.motorcontrol.FeedbackDevice",
            tags: []
          }
        ]
      }
    }
  ]
};
