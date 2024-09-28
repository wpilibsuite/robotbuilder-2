import { DialogTitle, DialogContent, Table, TableBody, TableRow, TableCell, Input, Switch, DialogActions, Button } from "@mui/material"
import Dialog from "@mui/material/Dialog"
import React, { useEffect, useState } from "react"
import { Project, Settings } from "../../bindings/Project"
import { HelpableLabel } from "../HelpableLabel"

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
    const isValid = !blankStringRegex.test(settings.name) && settings.teamNumber > 0
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
            <TableRow>
              <TableCell>
                <HelpableLabel description="The name of your robot project">
                  Project Name
                </HelpableLabel>
              </TableCell>
              <TableCell>
                <Input type="text"
                       placeholder={ "New Project" }
                       value={ settings.name }
                       error={ blankStringRegex.test(settings.name) }
                       onChange={ (event) => setSettings({ ...settings, name: event.target.value }) } />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <HelpableLabel description="Your FRC team number. You ought to know this!">
                  Team Number
                </HelpableLabel>
              </TableCell>
              <TableCell>
                <Input type="text"
                       placeholder="0000"
                       value={ isNaN(settings.teamNumber) ? "" : settings.teamNumber?.toFixed(0) ?? "" }
                       // Using not-greater-than-zero to account for null and NaN when the number field is blank
                       error={ !(settings.teamNumber > 0) }
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

                         setSettings({ ...settings, teamNumber: parseInt(event.target.value) })
                       } }/>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <HelpableLabel description="Enables support for automatic data logging in your project via the Epilogue library">
                  Enable Epilogue Logging
                </HelpableLabel>
              </TableCell>
              <TableCell>
                <Switch checked={ settings.epilogueSupport }
                        onChange={ (event) => setSettings({ ...settings, epilogueSupport: event.target.checked }) } />
              </TableCell>
            </TableRow>
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
