import { DialogTitle, DialogContent, Table, TableBody, TableRow, TableCell, Input, Switch, DialogActions, Button } from "@mui/material"
import Dialog from "@mui/material/Dialog"
import React, { useEffect, useState } from "react"
import { Project, Settings, SettingsCategory } from "../../bindings/Project"
import { HelpableLabel } from "../HelpableLabel"
import { ALL_SETTINGS } from "../../settings/Settings"

type SettingsDialogProps = {
  project: Project
  visible: boolean
  allowCancel: boolean
  onSave: (projectSettings: Settings) => void
  onCancel: (projectSettings: Settings) => void
}

export default function SettingsDialog({ project, visible, allowCancel, onSave, onCancel  }: SettingsDialogProps) {
  const blankStringRegex = /^[ ]*$/

  const [settings, setSettings] = useState({ ...project.settings })
  const [isValid, setValid] = useState(false)

  useEffect(() => {
    setSettings({ ...project.settings })
  }, [project, visible])

  useEffect(() => {
    let isValid = true

    for (const key in settings) {
      const value = settings[key]

      const category: SettingsCategory = ALL_SETTINGS[key.substring(0, key.lastIndexOf("."))]
      const setting = category.settings.find(s => s.key === key)
      if (setting.required) {
        switch (setting.type) {
          case "string":
            isValid &&= !blankStringRegex.test(value as string)
            break
          case "number":
            isValid &&= value as number > 0
            break
          case "boolean":
            break
        }
      }

      if (!isValid) {
        // Early exit if any required value is missing
        break
      }
    }

    setValid(isValid)
  }, [settings])

  return (
    <Dialog open={ visible } className="project-settings-dialog">
      <DialogTitle style={{ textAlign: "center" }}>
        Project Settings
      </DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            {
              (() => {
                const elements = []
                for (const categoryKey in ALL_SETTINGS) {
                  const category: SettingsCategory = ALL_SETTINGS[categoryKey]
                  elements.push((
                    <TableRow key={ categoryKey }>
                      <TableCell>
                        <h3>
                          { category.name }
                        </h3>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                  category.settings.forEach(setting => {
                    elements.push((
                      <TableRow key={ setting.key }>
                        <TableCell>
                          <HelpableLabel description={ setting.description }>
                            { setting.name }
                          </HelpableLabel>
                        </TableCell>
                        <TableCell>
                          {
                            (() => {
                              switch (setting.type) {
                                case "string":
                                  return (
                                    <Input type="text"
                                           placeholder={ "Value" }
                                           value={ settings[setting.key] }
                                           error={ setting.required && blankStringRegex.test(settings[setting.key] as string) }
                                           onChange={ (event) => setSettings({ ...settings, [setting.key]: event.target.value }) } />
                                  )
                                case "number":
                                  return (
                                    <Input type="text"
                                           placeholder={ "Value" }
                                           value={ isNaN(settings[setting.key] as number) ? "" : settings[setting.key]?.toFixed(0) ?? "" }
                                           // Using not-greater-than-zero to account for null and NaN when the number field is blank
                                           error={ setting.required && !(settings[setting.key] as number > 0) }
                                           onChange={ (event) => {
                                             // Prevent non-numeric values from being entered
                                             const input = event.target.value

                                             if (!input.match(/^([1-9]+[0-9]*)?$/g)) {
                                               event.target.value = input.replaceAll(/[^0-9]+/g, "")

                                               // Prevent leading zeroes
                                               if (event.target.value.charAt(0) === "0") {
                                                 event.target.value = event.target.value.substring(1)
                                               }
                                               return
                                             }

                                             setSettings({ ...settings, [setting.key]: parseInt(event.target.value) })
                                           } }/>
                                  )
                                case "boolean":
                                  return (
                                    <Switch checked={ settings[setting.key] as boolean }
                                            onChange={ (event) => setSettings({ ...settings, [setting.key]: event.target.checked }) } />
                                  )
                                default:
                                  // No editor, just show the value as text
                                  return (
                                    <span>
                                      { settings[setting.key] }
                                    </span>
                                  )
                              }
                            })()
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  })
                }
                return elements
              })()
            }
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        {
          allowCancel ? (
            <Button onClick={ () => onCancel(settings) }>
              Cancel
            </Button>
          )
            : <></>
        }
        <Button disabled={ !isValid } onClick={ () => onSave(settings) }>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  )
}
