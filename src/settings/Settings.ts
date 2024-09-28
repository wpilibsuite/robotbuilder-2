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
  ],
})
