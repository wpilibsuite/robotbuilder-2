import { Subsystem, SubsystemState } from "../../bindings/Command"
import { indent, methodName, unindent } from "./util"
import { generateStepInvocations, generateStepParams } from "./ActionGenerator"

export function generateState(state: SubsystemState, subsystem: Subsystem): string {
  console.log('[STATE-GENERATOR] Generating code for state', state)
  return unindent(
    `
    @Logged(name = "${ state.name }?")
    public boolean ${ methodName(state.name) }(${ generateStepParams([state.step].filter(s => !!s), subsystem) }) {
${ generateStepInvocations([state.step].filter(s => !!s), subsystem).map(i => indent(`return ${ i }`, 6)).join("\n") }
    }
    `,
  ).trimStart().trimEnd()
}
