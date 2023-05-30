import { ComponentDefinition } from "./ComponentDefinition";
import { CAN_TALON_FX } from "./definitions/TalonFX";
import { MOTOR_CONTROLLER_GROUP } from "./definitions/MotorControllerGroup";
import { DIFFERENTIAL_DRIVE } from "./definitions/DifferentialDrive";
import { PID_CONTROLLER } from "./definitions/PIDController";
import { ANALOG_GYRO } from "./definitions/AnalogGyro";
import { QUADRATURE_ENCODER } from "./definitions/QuadratureEncoder";
import { PWM_SPARK_MAX, PWM_TALON_FX, PWM_TALON_SRX, PWM_VICTOR_SPX, SPARK, TALON, VICTOR_SP } from "./definitions/PWMMotors";
import { DIFFERENTIAL_DRIVE_ODOMETRY } from "./definitions/DifferentialDriveOdometry";

export class ComponentDefinitions {
  definitions: ComponentDefinition[] = [];

  public addDefinition(definition: ComponentDefinition) {
    if (this.definitions.find(d => d.id === definition.id)) {
      console.warn("WARNING! A definition already exists with id", definition.id, "! The existing definition will be replaced with the new one");
      // const existingDefinition = this.definitions.find(d => d.id === definition.id);
      // this.definitions.splice(this.definitions.indexOf(existingDefinition), 1, definition);
      this.definitions = this.definitions.filter(d => d.id !== definition.id).concat(definition);
    } else {
      this.definitions.push(definition);
    }
  }

  public forId(id: string): ComponentDefinition {
    return this.definitions.find(d => d.id === id);
  }
}

export const COMPONENT_DEFINITIONS = new ComponentDefinitions();


// Seed the default values
COMPONENT_DEFINITIONS.addDefinition(ANALOG_GYRO);
COMPONENT_DEFINITIONS.addDefinition(QUADRATURE_ENCODER);

COMPONENT_DEFINITIONS.addDefinition(CAN_TALON_FX);
COMPONENT_DEFINITIONS.addDefinition(PWM_TALON_FX);
COMPONENT_DEFINITIONS.addDefinition(TALON);
COMPONENT_DEFINITIONS.addDefinition(PWM_TALON_FX);
COMPONENT_DEFINITIONS.addDefinition(PWM_TALON_SRX);
COMPONENT_DEFINITIONS.addDefinition(SPARK);
COMPONENT_DEFINITIONS.addDefinition(PWM_SPARK_MAX);
COMPONENT_DEFINITIONS.addDefinition(VICTOR_SP);
COMPONENT_DEFINITIONS.addDefinition(PWM_VICTOR_SPX);
COMPONENT_DEFINITIONS.addDefinition(MOTOR_CONTROLLER_GROUP);
COMPONENT_DEFINITIONS.addDefinition(DIFFERENTIAL_DRIVE);

COMPONENT_DEFINITIONS.addDefinition(PID_CONTROLLER);
COMPONENT_DEFINITIONS.addDefinition(DIFFERENTIAL_DRIVE_ODOMETRY);

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
        setInConstructor: true
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
              type: "boolean"
            }
          ]
        }
      }
    ],
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
        name: "Stop",
        description: "Stops the motor. Equivalent to setting the speed to 0",
        codeName: "stopMotor",
        hints: ["action"],
        parameters: [],
        returns: "void"
      }
    ]
  }
}
