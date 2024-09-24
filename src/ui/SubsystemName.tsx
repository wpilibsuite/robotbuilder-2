import React from "react"
import { Subsystem } from "../bindings/Command"

type SubsystemNameProps = {
  name?: string,
  subsystem?: Subsystem
}

export default function SubsystemName({ name, subsystem }: SubsystemNameProps) {
  if (subsystem) {
    name = subsystem.name
  }

  return (
    <span className="subsystem-name">{ name }</span>
  )
}
