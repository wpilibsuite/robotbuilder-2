import { unindent } from "../codegen/java/util"

export const BundledWpilibCommandsV2 = unindent(`
  {
    "fileName": "WPILibNewCommands.json",
    "name": "WPILib-New-Commands",
    "version": "1.0.0",
    "uuid": "111e20f7-815e-48f8-9dd6-e675ce75b266",
    "frcYear": "2025",
    "mavenUrls": [],
    "jsonUrl": "",
    "javaDependencies": [
      {
        "groupId": "edu.wpi.first.wpilibNewCommands",
        "artifactId": "wpilibNewCommands-java",
        "version": "wpilib"
      }
    ],
    "jniDependencies": [],
    "cppDependencies": [
      {
        "groupId": "edu.wpi.first.wpilibNewCommands",
        "artifactId": "wpilibNewCommands-cpp",
        "version": "wpilib",
        "libName": "wpilibNewCommands",
        "headerClassifier": "headers",
        "sourcesClassifier": "sources",
        "sharedLibrary": true,
        "skipInvalidPlatforms": true,
        "binaryPlatforms": [
          "linuxathena",
          "linuxarm32",
          "linuxarm64",
          "windowsx86-64",
          "windowsx86",
          "linuxx86-64",
          "osxuniversal"
        ]
      }
    ]
  }
`).trim()
