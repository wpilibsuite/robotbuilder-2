import { findCommand, Project } from "../../../bindings/Project";
import { Command } from "../../../bindings/Command";
import React from "react";
import { EditorStage } from "../CommandGroupEditor";
import { CommandTile } from "./CommandTile";
import { AddCommandDropTarget } from "./AddCommandDropTarget";
import { ReactSVG } from "react-svg";
import { InputLabel } from "@mui/material";

type StageEditorProps = {
  stage: EditorStage;
  project: Project;
  onChange: (stage: EditorStage) => void
};

export function StageEditor({ stage, project, onChange }: StageEditorProps) {
  const entryType = (group: EditorStage, command: Command) => {
    const endCond = group.endCondition;
    switch (endCond) {
      case "all":
        return "full";
      case "any":
        return "racer";
      case command.uuid:
        return "leader";
      default:
        if (findCommand(project, endCond)) {
          return "follower";
        } else {
          console.error("Parallel group end condition is not an expected value!", endCond);
          return "full";
        }
    }
  }

  return (
    <div className={ "parallel-group-editor" }>
      <div className={ "group-header" }>
        {/* TODO: Right-click on this for a context menu - contains options to change the end condition (at the very least, change from "all" to "any") and to remove the group outright from the sequence */ }
        <InputLabel>
          { stage.name }
        </InputLabel>
        {
          stage.commands.length > 1 ?
            <>
              <ReactSVG src={ 'icons/parallel-group-all-commands.svg' }
                        style={ {
                          cursor: "pointer",
                          transform: `scale(${ stage.endCondition === "all" ? '112.5%' : '100%' })`
                        } }
                        onClick={ () => {
                          stage.endCondition = "all";
                          onChange(stage);
                        } }/>
              <ReactSVG src={ 'icons/parallel-group-any-commands.svg' }
                        style={ {
                          cursor: "pointer",
                          transform: `scale(${ stage.endCondition === "any" ? '112.5%' : '100%' })`
                        } }
                        onClick={ () => {
                          stage.endCondition = "any";
                          onChange(stage);
                        } }/>
            </>
            : null
        }
      </div>
      {
        project.subsystems.map((subsystem) => {
          const command = stage.commands.find(c => c.usedSubsystems(project).find(u => subsystem.uuid === u));
          if (command) {
            return <CommandTile key={ subsystem.uuid }
                                command={ command }
                                stage={ stage }
                                onChange={ onChange }
                                entryType={ entryType(stage, command) }/>
          } else {
            return (
              <AddCommandDropTarget stage={ stage } subsystem={ subsystem } project={ project } onChange={ onChange }/>
            )
          }
        })
      }
    </div>
  );
}