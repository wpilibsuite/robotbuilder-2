import { ActionTemplate, ComponentDefinition } from "../ComponentDefinition"
import { MOTOR_CONTROLLER_GROUP } from "./MotorControllerGroup"

const STOP_MOVING_ACTION: ActionTemplate = {
  name: "Stop Moving",
  description: "Sets the wheel speeds to zero to stop the robot from moving",
  params: [], // no parameters
  steps: [
    // one step - "$self.stopMotor()", where $self will be replaced by the name of the generated component
    {
      type: "method-call",
      target: "$self",
      methodName: "stopMotor",
      params: [],
    },
  ],
}

const TANK_DRIVE_ACTION: ActionTemplate = {
  name: "Tank Drive",
  description: "Drives the robot by setting speeds for the left-side and right-side motors. If this is used for driver control, set squareInputs to true for better control at low speeds.",
  params: [
    { name: "leftSpeed", type: "double" },
    { name: "rightSpeed", type: "double" },
    { name: "squareInputs", type: "boolean" },
  ],
  steps: [
    // one step - "$self.tankDrive(leftSpeed, rightSpeed, squareInputs)", where $self will be replaced by the name of the generated component
    {
      type: "method-call",
      target: "$self",
      methodName: "tankDrive",
      params: [
        {
          paramName: "leftSpeed",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "leftSpeed",
          },
        },
        {
          paramName: "rightSpeed",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "rightSpeed",
          },
        },
        {
          paramName: "squareInputs",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "squareInputs",
          },
        },
      ],
    },
  ],
}

export const DIFFERENTIAL_DRIVE: ComponentDefinition = {
  id: "SAMPLE-differentialdrive",
  name: "Differential Drive",
  description: 'Provides high-level control for driving a robot. Can be operated with Tank Drive (each side controlled independently) or with Arcade Drive (linear and turning speeds controlled independently)',
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
          type: "double",
        },
        {
          name: "Turning Speed",
          description: "The speed to apply to turning.  This is combined with the Forward Speed input to calculate the power needed to output to the left and right side motors.",
          codeName: "zRotation",
          type: "double",
        },
        {
          name: "Squared Inputs",
          description: "Squares the input values to make the response act quadratically rather than linearly for improved control at lower speeds.  Maximum speeds are unaffected.",
          codeName: "squareInputs",
          type: "boolean",
          optional: true,
        },
      ],
      returns: "void",
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
          type: "double",
        },
        {
          name: "Right Speed",
          description: "The speed to drive the right-side motors at.  Ranges from -1 for full speed in reverse to +1 for full speed forward.  Values outside that range will be clamped to be in [-1, 1].",
          codeName: "rightSpeed",
          type: "double",
        },
        {
          name: "Squared Inputs",
          description: "Squares the input values to make the response act quadratically rather than linearly for improved control at lower speeds.  Maximum speeds are unaffected.",
          codeName: "squareInputs",
          type: "boolean",
          optional: true,
        },
      ],
      returns: "void",
    },
    {
      name: "Stop",
      codeName: "stopMotor",
      description: "Immediately stops all motors by setting their speeds to zero.",
      hints: ["action"],
      parameters: [],
      returns: "void",
    },
  ],
  properties: [
    {
      name: "Left Motors",
      description: "The motors that power the left-side wheels",
      codeName: "leftMotors",
      type: "vararg MotorController",
      wrapper: {
        definition: MOTOR_CONTROLLER_GROUP.id,
        propertyName: "motors",
      },
      setInConstructor: true,
    },
    {
      name: "Right Motors",
      description: "The motors that power the right-side wheels",
      codeName: "rightMotors",
      type: "vararg MotorController",
      wrapper: {
        definition: MOTOR_CONTROLLER_GROUP.id,
        propertyName: "motors",
      },
      setInConstructor: true,
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
            type: "double",
          },
        ],
      },
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
            type: "double",
          },
        ],
      },
    },
  ],

  templates: {
    states: [], // no states
    actions: [
      STOP_MOVING_ACTION,
      TANK_DRIVE_ACTION,
    ],
    commands: [
      {
        name: "Stop Driving",
        description: "Immediately sets the wheel speeds to zero and exits.",
        toInitialize: [],
        toExecute: {
          actionName: STOP_MOVING_ACTION.name,
          params: [],
        },
        endCondition: "once",
      },
      {
        name: "Tank Drive with Joysticks",
        description: "Drives the robot using joystick inputs, with separate joysticks controlling the left-side and right-side wheels",
        toInitialize: [],
        toExecute: {
          actionName: TANK_DRIVE_ACTION.name,
          params: [
            {
              // left speed
              paramName: TANK_DRIVE_ACTION.params[0].name,
              invocationType: "passthrough-supplier",
            },
            {
              // right speed
              paramName: TANK_DRIVE_ACTION.params[1].name,
              invocationType: "passthrough-supplier",
            },
            {
              // squared inputs
              paramName: TANK_DRIVE_ACTION.params[2].name,
              invocationType: "hardcode",
              hardcodedValue: "true",
            },
          ],
        },
        endCondition: "forever",
      },
    ],
  },
}
