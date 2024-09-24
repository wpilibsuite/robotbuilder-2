import { ActionParamCallOption, Param, Subsystem, SubsystemActionStep, SubsystemComponent } from "../bindings/Command"

import { CAN_TALON_FX } from "../components/definitions/TalonFX"
import { DIFFERENTIAL_DRIVE } from "../components/definitions/DifferentialDrive"
import { ANALOG_GYRO } from "../components/definitions/AnalogGyro"
import { PID_CONTROLLER } from "../components/definitions/PIDController"

/**
 * Creates a new subsystem using a differential drivetrain.  Includes definitions for four motors,
 * a gyro, and a PID controller to control turning, and actions and commands for using them.
 */
export function differentialDrivebaseTemplate() {
  const drivetrain = new Subsystem()
  drivetrain.name = "Drivetrain"

  const frontLeftMotor = new SubsystemComponent("Front Left Motor", CAN_TALON_FX, { deviceNumber: 1 })
  const backLeftMotor = new SubsystemComponent("Back Left Motor", CAN_TALON_FX, { deviceNumber: 2 })
  const frontRightMotor = new SubsystemComponent("Front Right Motor", CAN_TALON_FX, { deviceNumber: 3 })
  const backRightMotor = new SubsystemComponent("Back Right Motor", CAN_TALON_FX, { deviceNumber: 4 })
  const differentialDrive = new SubsystemComponent("Differential Drive", DIFFERENTIAL_DRIVE, {
    leftMotors: [frontLeftMotor.uuid, backLeftMotor.uuid],
    rightMotors: [frontRightMotor.uuid, backRightMotor.uuid],
  })

  const gyro = new SubsystemComponent("Gyro", ANALOG_GYRO, { channel: 1 })
  const turningPIDController = new SubsystemComponent("Turning PID Controller", PID_CONTROLLER, {
    kp: "10",
    ki: "0.5",
    kd: "1",
    tolerance: "1",
  })

  drivetrain.components = [
    gyro,
    frontLeftMotor,
    backLeftMotor,
    frontRightMotor,
    backRightMotor,
    differentialDrive,
    turningPIDController,
  ]

  const stopAction = drivetrain.createAction("Stop")
  stopAction.steps = [
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "stopMotor",
      params: [],
      uuid: "example-differential-drive-stop-motor",
    }),
  ]

  const tankDriveAction = drivetrain.createAction("Tank Drive")
  tankDriveAction.params = [
    Param.create("leftSpeed", "double"),
    Param.create("rightSpeed", "double"),
    Param.create("squareInputs", "boolean"),
  ]
  tankDriveAction.steps = [
    new SubsystemActionStep({
      component: differentialDrive.uuid,
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
      uuid: "example-differential-drive-tank-drive",
    }),
  ]

  const arcadeDriveAction = drivetrain.createAction("Arcade Drive")
  arcadeDriveAction.params = [
    Param.create("xSpeed", "double"),
    Param.create("zRotation", "double"),
    Param.create("squareInputs", "boolean"),
  ]
  arcadeDriveAction.steps = [
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "arcadeDrive",
      params: [
        {
          paramName: "xSpeed",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "xSpeed",
          },
        },
        {
          paramName: "zRotation",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "zRotation",
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
      uuid: "example-differential-drive-arcade-drive",
    }),
  ]

  const turnToAngleAction = drivetrain.createAction("Turn to Target Angle")
  turnToAngleAction.params = []
  turnToAngleAction.steps = [
    new SubsystemActionStep({
      component: gyro.uuid,
      methodName: "getAngle",
      params: [],
      uuid: "example-turn-to-angle-get-angle",
    }),
    new SubsystemActionStep({
      component: turningPIDController.uuid,
      methodName: "calculate",
      params: [
        {
          paramName: "measurement",
          arg: {
            type: "reference-step-output",
            step: "example-turn-to-angle-get-angle",
          },
        },
      ],
      uuid: "example-turn-to-angle-update-pid",
    }),
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "arcadeDrive",
      params: [
        {
          paramName: "xSpeed",
          arg: {
            type: "hardcode",
            hardcodedValue: "0",
          },
        },
        {
          paramName: "zRotation",
          arg: {
            type: "reference-step-output",
            step: "example-turn-to-angle-update-pid",
          },
        },
        {
          paramName: "squareInputs",
          arg: {
            type: "hardcode",
            hardcodedValue: "false",
          },
        },
      ],
      uuid: "example-turn-to-angle-drive-motors",
    }),
  ]

  const setTargetTurningAngleAction = drivetrain.createAction("Set Target Turning Angle")
  setTargetTurningAngleAction.params = [
    Param.create("setpoint", "double"),
  ]
  setTargetTurningAngleAction.steps = [
    new SubsystemActionStep({
      component: turningPIDController.uuid,
      methodName: "reset",
      params: [],
      uuid: "example-set-target-turning-angle-reset-pid",
    }),
    new SubsystemActionStep({
      component: turningPIDController.uuid,
      methodName: "setSetpoint",
      params: [
        {
          paramName: "setpoint",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "setpoint",
          },
        },
      ],
      uuid: "example-set-target-turning-angle-set-pid-setpoint",
    }),
  ]

  drivetrain.createState("Stopped")
  const atAngleState = drivetrain.createState("At Turning Angle")
  atAngleState.step = new SubsystemActionStep({
    component: turningPIDController.uuid,
    methodName: "atSetpoint",
    params: [],
  })

  const stopCommand = drivetrain.createCommand("Stop", stopAction, "once")
  stopCommand.params = []

  const tankDriveCommand = drivetrain.createCommand("Drive with Speeds", tankDriveAction, "forever")
  tankDriveCommand.params = [
    ActionParamCallOption.fromObjects(tankDriveAction, tankDriveAction.params[0], "passthrough-value"),
    ActionParamCallOption.fromObjects(tankDriveAction, tankDriveAction.params[1], "passthrough-value"),
    ActionParamCallOption.fromObjects(tankDriveAction, tankDriveAction.params[2], "hardcode", "false"),
  ]

  const arcadeDriveCommand = drivetrain.createCommand("Arcade Drive with Joysticks", arcadeDriveAction, "forever")
  arcadeDriveCommand.params = [
    ActionParamCallOption.fromObjects(arcadeDriveAction, arcadeDriveAction.params[0], "passthrough-supplier"),
    ActionParamCallOption.fromObjects(arcadeDriveAction, arcadeDriveAction.params[1], "passthrough-supplier"),
    ActionParamCallOption.fromObjects(arcadeDriveAction, arcadeDriveAction.params[2], "hardcode", "true"),
  ]

  const turnToAngleCommand = drivetrain.createCommand("Turn To Angle", turnToAngleAction, atAngleState.uuid)
  turnToAngleCommand.params = [
    ActionParamCallOption.fromObjects(setTargetTurningAngleAction, setTargetTurningAngleAction.params[0], "passthrough-value"),
  ]
  turnToAngleCommand.toInitialize = [setTargetTurningAngleAction.uuid]
  turnToAngleCommand.toComplete = [stopAction.uuid]
  turnToAngleCommand.toInterrupt = [] // we could also run the stop action here

  return drivetrain
}
