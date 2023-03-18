import { SubsystemState } from "../../bindings/Command";
import { methodName, unindent } from "./util";

export function generateState(state: SubsystemState): string {
  return unindent(
    `
    /**
     * The ${ state.name } state.
     * TODO: document which commands end on this state.
     */
    public boolean ${ methodName(state.name) }() {
      // Implement me!
    }
    `
  ).trimStart().trimEnd()
}
