import { unindent } from "../codegen/java/util";

export const BundledPreferences = unindent(`
  {
    "enableCppIntellisense": false,
    "currentLanguage": "java",
    "projectYear": "2025",
    "teamNumber": 9999
  }
`).trim()
