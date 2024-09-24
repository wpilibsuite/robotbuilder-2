import { findCommand, Project } from "../../../bindings/Project"
import React, { useState } from "react"
import { AtomicCommand, Subsystem } from "../../../bindings/Command"
import Menu from "@mui/material/Menu"
import { Button, Divider, MenuItem } from "@mui/material"
import { EditorCommandGroup, EditorStage } from "../CommandGroupEditor"
import * as IR from '../../../bindings/ir'
import { variableName } from "../../../codegen/java/util"

type AddCommandDropTargetProps = {
  sequence: EditorCommandGroup;
  stage: EditorStage;
  subsystem: Subsystem;
  project: Project;
  onChange: (stage: EditorStage) => void
};

/**
 * Performs a logical XOR on two arrays of items.  Returns an array of the items that only appear in one array or the
 * other, but not both.
 *
 * @example
 * xor([1, 2], [1, 2]) // => []
 * xor([1, 2], [1, 3]) // => [2, 3]
 * xor([1, 2], [3, 4]) // => [1, 2, 3, 4]
 *
 * @param a1 the first array of items
 * @param a2 the second array of items
 */
function xor<T>(a1: T[], a2: T[]): T[] {
  let items = a1.concat(...a2)

  // kick out anything that appears more than once
  items = items.filter(i => items.indexOf(i) === items.lastIndexOf(i))

  return items
}

export function AddCommandDropTarget({ sequence, stage, subsystem, project, onChange }: AddCommandDropTargetProps) {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null)

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu(
      contextMenu == null ?
        { mouseX: event.clientX, mouseY: event.clientY } :
        null,
    )
  }
  const handleClose = () => setContextMenu(null)

  const addCommand = (command: AtomicCommand | IR.Group) => {
    return () => {
      let wrapper: IR.CommandInvocation
      if (command instanceof AtomicCommand) {
        // wrap in a command invocation
        // TODO: Prevent name collisions
        wrapper = IR.CommandInvocation.fromAtomicCommand(command)
      } else {
        console.log('Wrapping', command)
        wrapper = new IR.CommandInvocation(
          command.requirements(),
          command.uuid,
          command.params
            .filter(p => p.appearsOnFactory())
            .map(p => {
              let varname = variableName(p.name)
              const existingParamNames = sequence.stages.flatMap(s => s.group.params).map(p => variableName(p.name))
              let i = 2
              let needsSuffix = false
              while (existingParamNames.includes(varname)) {
                // conflict! increment a number suffix until we get a unique name
                // TODO: Maybe track index numbers separately?
                varname = `${ variableName(p.name) }${ i }`
                i++
                needsSuffix = true
              }
              return new IR.ParamPlaceholder((needsSuffix ? `${ p.name } ${ i }` : p.name), p.original, [p], null)
            }),
        )
      }
      stage.group.commands.push(wrapper)
      // bubble up any required params
      stage.group.params.push(...wrapper.params.map(p => {
        return new IR.ParamPlaceholder(p.name, p.original, [p], null)
      }))
      onChange(stage)
      handleClose()
    }
  }

  const allCommands = (project.commands as (IR.Group | AtomicCommand)[]).concat(project.subsystems.flatMap(s => s.commands))
  console.log('[ADD-COMMAND-DROP-TARGET] All commands:', allCommands)

  const availableCommandsToAdd =
    allCommands
      .filter(c => c.uuid !== stage.group?.uuid && c.uuid !== sequence.groupId) // exclude the currently edited command to avoid infinite recursion
      .filter(c => !findCommand(project, sequence.groupId) || !c.runsCommand(sequence.groupId)) // exclude any commands that run the currently edited command to avoid infinite recursion
      .filter(c => c instanceof AtomicCommand || !stage.group.runsCommand(c.uuid)) // exclude any groups that include (even implicitly) any of the commands already in the group
      .filter(c => c.requirements().includes(subsystem.uuid)) // only allow the commands that use the subsystem we're on
      .filter(c => stage.group.commands.length === 0 || xor(c.requirements(), stage.group.commands.flatMap(sc => sc.requirements())).length === project.subsystems.length) // exclude any commands that use a subsystem already in use

  console.log('[ADD-COMMAND-DROP-TARGET] Available commands for stage', stage.name, ', subsystem', subsystem.name, ':', availableCommandsToAdd)

  const inUse = !!sequence.stages.find(s => s.group.requirements().includes(subsystem.uuid))

  return (
    <div>
      <Button id="add-command-button" className={ `command-drop-target ${ inUse ? 'idle' : 'open' }` }
              onClick={ handleContextMenu }
              disabled={ availableCommandsToAdd.length < 1 }>
        {
          availableCommandsToAdd.length > 0 && !inUse ?
            '+ Add Command' :
            'Uncontrolled' // No commands available for this subsystem
        }
      </Button>

      <Menu open={ contextMenu != null }
            anchorReference="anchorPosition"
            anchorPosition={ contextMenu !== null ? { left: contextMenu.mouseX, top: contextMenu.mouseY } : undefined }>
        {
          availableCommandsToAdd.map(command => {
            return (
              <MenuItem key={ command.uuid } onClick={ addCommand(command) }>
                { command.name }
              </MenuItem>
            )
          })
        }
        <Divider/>
        <MenuItem onClick={ handleClose }>
          Close
        </MenuItem>
      </Menu>
    </div>
  )
}
