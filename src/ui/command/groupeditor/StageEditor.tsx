import { Project } from "../../../bindings/Project"
import * as IR from "../../../bindings/ir"
import React, { useEffect, useState } from "react"
import { EditorCommandGroup, EditorStage } from "../CommandGroupEditor"
import { CommandTile } from "./CommandTile"
import { AddCommandDropTarget } from "./AddCommandDropTarget"
import { ReactSVG } from "react-svg"
import { Button, InputLabel } from "@mui/material"

type StageEditorProps = {
  sequence: EditorCommandGroup;
  stage: EditorStage;
  project: Project;
  onDelete: (stage: EditorStage) => void;
  onChange: (stage: EditorStage) => void
};

export const entryType = (stage: EditorStage, command: IR.CommandInvocation) => {
  const endCond = stage.group.endCondition
  switch (endCond) {
    case "all":
      return "full"
    case "any":
      return "racer"
    case command.command:
      return "leader"
    default:
      return "follower"
  }
}

export function StageEditor({ sequence, stage, project, onDelete, onChange }: StageEditorProps) {
  const [pendingDelete, setPendingDelete] = useState(false)

  // reset if the component is reused for a stage that was just deleted
  useEffect(() => setPendingDelete(false), [stage])

  return (
    <div className={ "parallel-group-editor" }>
      <div className={ "group-header" }>
        <InputLabel>
          { stage.name }
        </InputLabel>
        {
          stage.group.commands.length > 1 ?
            <>
              <ReactSVG src={ "icons/parallel-group-all-commands.svg" }
                        style={ {
                          cursor: "pointer",
                          transform: `scale(${ stage.group.endCondition === "all" ? "112.5%" : "100%" })`,
                        } }
                        onClick={ () => {
                          stage.group.endCondition = "all"
                          onChange(stage)
                        } }/>
              <ReactSVG src={ "icons/parallel-group-any-commands.svg" }
                        style={ {
                          cursor: "pointer",
                          transform: `scale(${ stage.group.endCondition === "any" ? "112.5%" : "100%" })`,
                        } }
                        onClick={ () => {
                          stage.group.endCondition = "any"
                          onChange(stage)
                        } }/>
            </>
            : null
        }
        {
          pendingDelete ?
            <Button style={{ height: "23px" }} onBlur={ () => setPendingDelete(false) } onClick={ () => onDelete(stage) }>
              Bye
            </Button> :
            <Button style={{ height: "23px" }} onClick={ () => stage.group.commands.length > 0 ? setPendingDelete(true) : onDelete(stage) }>
              Delete
            </Button>
        }
      </div>
      {
        project.subsystems.map((subsystem) => {
          const command = stage.group.commands.find(c => c instanceof IR.CommandInvocation && c.requirements().includes(subsystem.uuid)) as IR.CommandInvocation
          if (command) {
            return <CommandTile key={ subsystem.uuid }
                                project={ project }
                                command={ command }
                                stage={ stage }
                                group={ sequence }
                                onChange={ onChange }
                                entryType={ entryType(stage, command) } />
          } else {
            return (
              <AddCommandDropTarget key={ subsystem.uuid }
                                    sequence={ sequence }
                                    stage={ stage }
                                    subsystem={ subsystem }
                                    project={ project }
                                    onChange={ onChange } />
            )
          }
        })
      }
    </div>
  )
}
