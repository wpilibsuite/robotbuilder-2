import { ComponentDefinition } from "../ComponentDefinition";

export const DIFFERENTIAL_DRIVE: ComponentDefinition = {
  id: "SAMPLE-differentialdrive",
  name: "Differential Drive",
  fqn: "edu.wpi.first.wpilibj.drive.DifferentialDrive",
  className: "DifferentialDrive",
  wpilibApiTypes: [],
  type: "actuator",
  hints: ["action"],
  methods: [
    {
      name: "Arcade Drive",
      description: "Drives the motors with a single joystick like an arcade game.  Traditionally, moving the joystick forward and back drives straight in those directions, while moving left or right makes the robot turn in place or drive in an arc.  Note that, because most joysticks don't output in a [-1, 1] on both axes simultaneously, the maximum speed is typically lower than tank drive when driving in an arc",
      codeName: "arcadeDrive",
      hints: ["action", "joystick-input"],
      parameters: [
        {
          name: "Forward Speed",
          description: "The speed to apply to straight-line movement.  This is combined with the Turning Speed input to calculate the power needed to output to the left and right side motors.",
          codeName: "xSpeed",
          type: "double"
        },
        {
          name: "Turning Speed",
          description: "The speed to apply to turning.  This is combined with the Forward Speed input to calculate the power needed to output to the left and right side motors.",
          codeName: "zRotation",
          type: "double"
        },
        {
          name: "Squared Inputs",
          description: "Squares the input values to make the response act quadratically rather than linearly for improved control at lower speeds.  Maximum speeds are unaffected.",
          codeName: "squareInputs",
          type: "boolean",
          optional: true
        }
      ],
      returns: "void"
    },
    {
      name: "Tank Drive",
      description: "Drives the motors like a tank, where the driver uses independent joysticks to control the treads on the left and right side independently.",
      codeName: "tankDrive",
      hints: ["action", "joystick-input"],
      parameters: [
        {
          name: "Left Speed",
          description: "The speed to drive the left-side motors at. Ranges from -1 for full speed in reverse to +1 for full speed forward.  Values outside that range will be clamped to be in [-1, 1].",
          codeName: "leftSpeed",
          type: "double"
        },
        {
          name: "Right Speed",
          description: "The speed to drive the right-side motors at.  Ranges from -1 for full speed in reverse to +1 for full speed forward.  Values outside that range will be clamped to be in [-1, 1].",
          codeName: "rightSpeed",
          type: "double"
        },
        {
          name: "Squared Inputs",
          description: "Squares the input values to make the response act quadratically rather than linearly for improved control at lower speeds.  Maximum speeds are unaffected.",
          codeName: "squareInputs",
          type: "boolean",
          optional: true
        }
      ],
      returns: "void"
    },
    {
      name: "Stop",
      codeName: "stopMotor",
      description: "Immediately stops all motors by setting their speeds to zero.",
      hints: ["action"],
      parameters: [],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "Left Motor",
      description: "The motor that powers the left-side wheels",
      codeName: "leftMotor",
      type: "MotorController",
      setInConstructor: true
    },
    {
      name: "Right Motor",
      description: "The motor that powers the right-side wheels",
      codeName: "rightMotor",
      type: "MotorController",
      setInConstructor: true
    },
    {
      name: "Deadband",
      description: "The lower limit on inputs to motor speeds.  Any input speed less than this value will be set to zero instead and the motor will not move.",
      codeName: "deadband",
      type: "double",
      setInConstructor: false,
      setter: {
        name: "Set Deadband",
        description: "Sets the deadband of the drive.  Any motor inputs less than this value will be set to zero instead.",
        codeName: "setDeadband",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Deadband",
            description: "",
            codeName: "deadband",
            type: "double"
          }
        ]
      }
    },
    {
      name: "Maximum Output",
      description: "The maximum motor output.  This is used to scale the output values calculated by the controller. For example, set to 0.5 to make a motor set to a speed of 1.0 turn at only half speed.",
      codeName: "maxOutput",
      type: "double",
      setInConstructor: false,
      setter: {
        name: "Set Maximum Output",
        description: "",
        codeName: "setMaxOutput",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Max Output",
            description: "",
            codeName: "maxOutput",
            type: "double"
          }
        ]
      }
    }
  ]
};
