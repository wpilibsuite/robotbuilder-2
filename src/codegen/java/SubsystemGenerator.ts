import { Subsystem, SubsystemComponent } from "../../bindings/Command";
import { Project } from "../../bindings/Project";
import { className, fieldDeclaration, indent, unindent, variableName } from "./util";
import { generateCommand } from "./CommandGenerator";
import { generateState } from "./StateGenerator";
import { generateAction } from "./ActionGenerator";


function propertyToValue(type: string, value, subsystem): string {
  console.debug('propertyToValue(', type, ', ', value, ', ', subsystem, ')');
  if (!type) return 'null';

  if (!value) {
    console.warn('No value provided!');
    return "/* You forgot to set a value! */";
  }

  if (typeof value === 'string' && value.length === 36) {
    // might be a UUID for another component
    const maybeComp: SubsystemComponent = subsystem.components.find(c => c.uuid === value);
    if (maybeComp) {
      // it is! convert to a variable name for reference
      return variableName(maybeComp.name);
    }
  } else if (Array.isArray(value)) {
    const joinedDefs = value.map(element => propertyToValue(type, element, subsystem));
    if (type.startsWith("vararg")) {
      return joinedDefs.join(", ");
    } else {
      return `new ${ type }[] { ${ joinedDefs.join(", ") } }`;
    }
  }

  return value;
}

export function generateSubsystem(subsystem: Subsystem, project: Project) {
  if (!subsystem || !project) return null;

  let clazz = className(subsystem.name);

  const commands = subsystem.commands;

  return unindent(
    `
    package frc.robot.subsystems;

${ [...new Set(subsystem.components.map(c => c.definition.fqn))].sort().map(fqn => indent(`import ${ fqn };`, 4)).join("\n") }

    /**
     * The ${ subsystem.name } subsystem.
     */
    public class ${ clazz } extends SubsystemBase {
${ subsystem.components.map(c => indent(`${ fieldDeclaration(c.definition.className, c.name) };`, 6)).join("\n") }

      public ${ clazz }() {
        setName("${ subsystem.name }");
${ subsystem.components.map(c => indent(`this.${ variableName(c.name) } = new ${ c.definition.className }(${ c.definition.properties.filter(p => p.setInConstructor).map(p => propertyToValue(p.type, c.properties[p.codeName], subsystem)).join(", ") });`, 8)).join("\n") }

        var commandList = Shuffleboard.getTab("${ subsystem.name }").getLayout("Commands", BuiltInLayouts.kList);
${ commands.map(c => indent(`commandList.add("${ c.name }", this.${ variableName(c.name) }Command());`, 8)).join("\n") }
      }

      // ACTIONS

${ subsystem.actions.map(a => indent(generateAction(a), 6)).join("\n\n") }

      // STATES

${ subsystem.states.map(s => indent(generateState(s), 6)).join("\n\n") }

      // COMMANDS

${ commands.map(c => indent(generateCommand(c.name, subsystem, c.action, c.endCondition, c.params), 6)).join("\n\n") }
    }
    `
  );
}