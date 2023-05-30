import { ComponentDefinition } from "../ComponentDefinition";

export const DIFFERENTIAL_DRIVE_ODOMETRY: ComponentDefinition = {
  name: "Differential Drive Odometry",
  id: "SAMPLE-differentialdriveodometry",
  description: "Determines the robot's pose relative to its starting position based on periodic updates from encoders and a gyroscope. Accuracy may be lost if the drivetrain skips or has too much chatter.",
  type: "control",
  className: "DifferentialDriveOdometry",
  fqn: "edu.wpi.first.math.kinematics.DifferentialDriveOdometry",
  wpilibApiTypes: [],
  hints: ["pose-estimation"],
  properties: [
    {
      name: "Initial Angle",
      description: "The initial angle of the robot",
      type: "edu.wpi.first.math.geometry.Rotation2d",
      codeName: "gyroAngle",
      setInConstructor: true,
      defaultValue: "new Rotation2d()"
    },
    {
      name: "Initial Left Distance",
      description: "The initial total distance travelled by the left side of the robot. Distnace must be provided in meters.",
      type: "double",
      codeName: "leftDistanceMeters",
      setInConstructor: true,
      defaultValue: "0"
    },
    {
      name: "Initial Right Distance",
      description: "The initial total distance travelled by the right side of the robot. Distance must be provided in meters.",
      type: "double",
      codeName: "rightDistanceMeters",
      setInConstructor: true,
      defaultValue: "0"
    }
  ],
  methods: [
    {
      name: "Update",
      codeName: "update",
      description: "Updates the odometry estimate based on current sensor data.",
      hints: ["action"],
      returns: "void",
      parameters: [
        {
          name: "Gyro Angle",
          codeName: "gyroAngle",
          type: "edu.wpi.first.math.geometry.Rotation2d",
          description: "The current angle reported by the gyroscope."
        },
        {
          name: "Left Distance",
          codeName: "leftDistanceMeters",
          type: "double",
          description: "The total distance travelled by the left side of the drive since odeomotry started"
        },
        {
          name: "Right Distance",
          codeName: "rightDistanceMeters",
          type: "double",
          description: "The total distance travelled by the right side of the drive since odeomotry started"
        }
      ]
    },
    {
      name: "Get Pose Estimate",
      codeName: "getPoseMeters",
      description: "Gets the most recent pose estimate. Requires `Update` to have run",
      hints: ["state"],
      returns: "edu.wpi.first.math.geometry.Pose2d",
      parameters: []
    }
  ]
}
