import React from "react"
import { SubsystemState } from "../bindings/Command"

type StateProps = {
  name?: string,
  state?: SubsystemState
}

export default function SubsystemStateName({ name, state }: StateProps) {
  if (state) {
    name = state.name
  }

  return (
    <span className="subsystem-state-name">{ name }</span>
  )
}
