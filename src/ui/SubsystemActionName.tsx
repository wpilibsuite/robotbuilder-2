import React from "react"
import { SubsystemAction } from "../bindings/Command"

type ActionProps = {
  name?: string,
  action?: SubsystemAction
}

export default function SubsystemActionName({ name, action }: ActionProps) {
  if (action) {
    name = action.name
  }

  return (
    <span className="subsystem-action-name">{ name }</span>
  )
}
