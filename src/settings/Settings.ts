import { SettingsCategory } from "../bindings/Project"

export const ALL_SETTINGS = {}

export function registerCategory(setting: SettingsCategory) {
  ALL_SETTINGS[setting.key] = setting
}

// Seed default values

registerCategory({
  key: "robotbuilder.general",
  name: "General",
  settings: [
    {
      key: "robotbuilder.general.project_name",
      name: "Project Name",
      description: "The name of your robot project",
      required: true,
      type: "string",
      defaultValue: null,
    },
    {
      key: "robotbuilder.general.team_number",
      name: "Team Number",
      description: "Your FRC team number. You ought to know this!",
      required: true,
      type: "number",
      defaultValue: null,
    },
    // TODO: Implement sensor caching. It's out of scope for the initial project settings work.
    // {
    //   key: "robotbuilder.general.cache_sensor_values",
    //   name: "Cache Sensor Values",
    //   description: "Changes code generation to read sensor values once per loop, instead of on demand. This setting may improve performance",
    //   required: false,
    //   type: "boolean",
    //   defaultValue: false
    // }
  ],
})

registerCategory({
  key: "wpilib.epilogue",
  name: "Epilogue",
  settings: [
    {
      key: "wpilib.epilogue.enabled",
      name: "Enable Epilogue Support",
      description: "Enables support for automatic data logging in your project via the Epilogue library",
      required: false,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "wpilib.epilogue.log_to_disk",
      name: "Log to Disk",
      description: "Enables logging to the roboRIO's built in flash storage. Be very careful if using a roboRIO 1 due to its limited disk space. Accumulating too many log files may prevent access to the device and require a full re-flash",
      required: false,
      type: "boolean",
      defaultValue: false,
    },
    {
      key: "wpilib.epilogue.log_to_nt",
      name: "Log to Network",
      description: "Enables logging to the network for DS-based applications to view or record",
      required: false,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "wpilib.epilogue.logging_root",
      name: "Logging Root",
      description: `The root path under which logged data should appear. This is used by both file- and network-based logging. Defaults to "Robot" if unspecified or left blank`,
      required: false,
      type: "string",
      defaultValue: "Robot",
    },
  ],
})
