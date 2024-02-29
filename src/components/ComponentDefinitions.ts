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
