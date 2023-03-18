import { SubsystemAction } from "../../bindings/Command";
import { methodName, unindent, variableName } from "./util";

export function generateAction(action: SubsystemAction): string {
  return unindent(
    `
    /**
     * The ${ action.name } action.  If a command runs this action, it will be called periodically
     * (50 times per second by default) until that command completes.
     * TODO: document which commands run this action.
     */
    public void ${ methodName(action.name) }(${ action.params.map(p => `${ p.type } ${ variableName(p.name) }`).join(", ") }) {
      // Implement me!
    }
    `
  ).trimStart().trimEnd();
}
