import { Project } from "../../bindings/Project"
import React, { useState } from "react"
import { CommandList } from "./CommandList"
import { CommandGroupEditor, EditorCommandGroup } from "./CommandGroupEditor"
import { Button } from "@mui/material"
import * as IR from '../../bindings/ir'

function createParallelGroup(project: Project, editorGroup: EditorCommandGroup): IR.ParGroup {
  const stage = editorGroup.stages[0]
  const group = stage.group
  group.name = editorGroup.name
  return group
}

function createSequentialGroup(project: Project, editorGroup: EditorCommandGroup): IR.SeqGroup {
  return IR.sequence((s) => {
    s.name = editorGroup.name
    s.uuid = editorGroup.groupId

    const relevantGroups = editorGroup.stages.map(stage => stage.group).filter(g => g.commands.length > 0)
    s.commands.push(...relevantGroups)
    s.params.push(...s.commands.flatMap(c => c.params).flatMap(filterAs(IR.ParamPlaceholder)))
    console.log('Relevant groups', relevantGroups)
    console.log('Group params', s.params)
  })
}

function replace<T>(arr: T[], finder: (T) => boolean, newValue: T): T[] {
  const index = arr.findIndex(finder)
  arr.splice(index, 1, newValue)
  return arr
}

export function saveEditorGroup(project: Project, editorGroup: EditorCommandGroup): IR.Group {
  console.log('[SAVE-SEQUENCE] Sequence:', editorGroup)
  let group: IR.Group = editorGroupToIR(project, editorGroup)
  if (editorGroup.stages.length === 0) {
    // empty group, just have something basic
    group = IR.sequence((s) => s.name = editorGroup.name)
  } else if (editorGroup.stages.length === 1) {
    group = createParallelGroup(project, editorGroup)
  } else {
    group = createSequentialGroup(project, editorGroup)
  }

  if (project.commands.find(c => c.uuid === group.uuid)) {
    replace(project.commands, c => c.uuid === group.uuid, group)
  } else {
    project.commands.push(group)
  }

  console.log('[SAVE-SEQUENCE] Saved command group', group)

  return group
}

export function editorGroupToIR(project: Project, editorGroup: EditorCommandGroup): IR.Group {
  const relevantStages = editorGroup.stages.filter(s => s.group.commands.length > 0)

  if (relevantStages.length === 0) {
    return IR.sequence((s) => s.name = editorGroup.name)
  } else if (relevantStages.length === 1) {
    return createParallelGroup(project, editorGroup)
  } else {
    return createSequentialGroup(project, editorGroup)
  }
}

function filterAs<T>(type: new (...a) => T): (value) => [T] | [] {
  return (value): [T] | [] => {
    if (value instanceof type) {
      return [value as unknown as T]
    }

    return []
  }
}

export function Commands({ project }: { project: Project }) {
  const [editedSequence, setEditedSequence] = useState(null as EditorCommandGroup)
  const [sequenceSaved, setSequenceSaved] = useState(true)

  const requestGroupEdit = (group: IR.Group) => {
    if (sequenceSaved) {
      setEditedSequence(EditorCommandGroup.fromGroup(project, group))
    } else {
      // TODO: Prompt to save the current sequence
    }
  }

  return (
    <div className={ "commands" }>
      {
        editedSequence ?
          <CommandGroupEditor group={ editedSequence }
                              project={ project }
                              onSave={ (seq) => {
                                saveEditorGroup(project, seq)
                                setSequenceSaved(true)
                              } }
                              onChange={ (seq) => {
                                console.log('Sequence changed to', seq)
                                setEditedSequence({ ...seq })
                                setSequenceSaved(false)
                              } }/> :
          null
      }
      <div style={ { display: "flex", flexDirection: "row", gap: "8px" } }>
        {
          project.subsystems.map(subsystem => {
            return (
              <CommandList key={ subsystem.uuid }
                           title={ subsystem.name }
                           commands={ subsystem.commands }
                           requestEdit={ requestGroupEdit }/>)
          })
        }
        <div>
          <CommandList title={ "Command Groups" }
                       commands={ project.commands }
                       requestEdit={ requestGroupEdit }/>
          <Button id="new-command-group-button" onClick={ () => {
            const group = IR.sequence((s) => {
              s.name = "New Command Group"
              s.parallel("all", (p) => p.name = "Stage 1")
            })
            requestGroupEdit(group)
          } }>
            Create New Group
          </Button>
        </div>
      </div>
    </div>
  )
}
