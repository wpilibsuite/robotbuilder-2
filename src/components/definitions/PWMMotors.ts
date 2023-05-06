import { ComponentDefinition } from "../ComponentDefinition";
import { PwmMotorController } from "../ComponentDefinitions";

export const PWM_TALON_FX: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-pwmtalonfx',
  name: 'Talon FX (PWM)', 
  className: 'PWMTalonFX', 
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.PWMTalonFX'
});

export const PWM_TALON_SRX: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-pwmtalonsrx',
  name: 'Talon SRX (PWM)',
  className: 'PWMTalonSRX',
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.PWMTalonSRX'
});

export const SPARK: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-spark',
  name: 'Spark',
  className: 'Spark',
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.Spark'
});

export const PWM_SPARK_MAX: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-pwmsparkmax',
  name: 'Spark Max (PWM)',
  className: 'PWMSparkMax',
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.PWMSparkMax'
});

export const TALON: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-talon',
  name: 'Talon',
  className: 'Talon',
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.Talon'
});

export const VICTOR_SP: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-victorsp',
  name: 'Victor SP',
  className: 'VictorSP',
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.VictorSP'
});

export const PWM_VICTOR_SPX: ComponentDefinition = PwmMotorController({
  id: 'SAMPLE-pwmvictorspx',
  name: 'Victor SPX (PWM)',
  className: 'PWMVictorSPX',
  fqn: 'edu.wpi.first.wpilibj.motorcontrol.PWMVictorSPX'
});

