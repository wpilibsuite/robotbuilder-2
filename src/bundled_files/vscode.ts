import { unindent } from "../codegen/java/util"

export const BundledLaunchJson = unindent(`
  {
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [

      {
        "type": "wpilib",
        "name": "WPILib Desktop Debug",
        "request": "launch",
        "desktop": true,
      },
      {
        "type": "wpilib",
        "name": "WPILib roboRIO Debug",
        "request": "launch",
        "desktop": false,
      }
    ]
  }
`).trim()

export const BundledSettingsJson = unindent(`
  {
    "java.configuration.updateBuildConfiguration": "automatic",
    "java.server.launchMode": "Standard",
    "files.exclude": {
      "**/.git": true,
      "**/.svn": true,
      "**/.hg": true,
      "**/CVS": true,
      "**/.DS_Store": true,
      "bin/": true,
      "**/.classpath": true,
      "**/.project": true,
      "**/.settings": true,
      "**/.factorypath": true,
      "**/*~": true
    },
    "java.test.config": [
      {
        "name": "WPIlibUnitTests",
        "workingDirectory": "\${workspaceFolder}/build/jni/release",
        "vmargs": [ "-Djava.library.path=\${workspaceFolder}/build/jni/release" ],
        "env": {
          "LD_LIBRARY_PATH": "\${workspaceFolder}/build/jni/release" ,
          "DYLD_LIBRARY_PATH": "\${workspaceFolder}/build/jni/release"
        }
      },
    ],
    "java.test.defaultConfig": "WPIlibUnitTests"
  }
`).trim()
