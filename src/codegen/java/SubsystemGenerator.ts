import { Subsystem, SubsystemComponent } from "../../bindings/Command";
import { Project } from "../../bindings/Project";
import { className, fieldDeclaration, indent, methodName, unindent, variableName } from "./util";
import { generateCommand } from "./CommandGenerator";
import { generateState } from "./StateGenerator";
import { generateAction_future } from "./ActionGenerator";
import { Property } from "../../components/ComponentDefinition";


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
    } else {
      // Probably deleted a component reference by this one - make note of that instead of just pasting in the raw UUID
      return "/* Unknown component */";
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

function generatePropertySetting(subsystem: Subsystem, component: SubsystemComponent): string[] {
  const definition = component.definition;
  // 1. Find all properties in the definition that are NOT set in the constructor
  // 2. Group by setter
  // 3. Find each param defined by the setter method and look up their values on the configured component properties
  // 4. Pass those values into the setter method in the order they're defined ON THE SETTER

  const properties = definition.properties.filter(p => !p.setInConstructor).filter(p => !!p.setter);
  const groupedProperties = properties.reduce((group, property) => {
    const { setter } = property;
    group[setter.codeName] = group[setter.codeName] ?? [];
    group[setter.codeName].push(property);
    return group;
  }, {});

  Object.keys(groupedProperties).forEach(setterName => {
    const propsForSetter: Property[] = groupedProperties[setterName];
    if (propsForSetter.length === 0 ||
      propsForSetter.filter(p => component.properties.hasOwnProperty(p.codeName)).length === 0) {
      // No configured properties for this, kick it out
      console.debug('Not generating property setter for', setterName, 'because no configured properties exist that use it.');
      delete groupedProperties[setterName];
    }
  });

  const propertySetterCalls: string[] = Object.keys(groupedProperties).map(setterName => {
    const propertiesForSetter: Property[] = groupedProperties[setterName]; // these should already be sorted in parameter order
    // Assuming no method overloading, we can just fetch the first setter method definition with this name
    const setter = propertiesForSetter[0].setter;
    return `this.${ variableName(component.name) }.${ methodName(setter.name) }(${ propertiesForSetter.map(p => propertyToValue(p.type, component.properties[p.codeName], subsystem)).join(", ") });`;
  });

  return propertySetterCalls;
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
${ subsystem.components.map(c => indent(`this.${ variableName(c.name) } = new ${ c.definition.className }(${ c.definition.properties.filter(p => p.setInConstructor).map(p => propertyToValue(p.type, c.properties[p.codeName], subsystem)).join(", ") });`, 8)).join("\n") }

${ subsystem.components.flatMap(c => generatePropertySetting(subsystem, c)).map(setter => indent(setter, 8)).join("\n") }

        // Dashboard settings
        setName("${ subsystem.name }");

        var commandList = Shuffleboard.getTab("${ subsystem.name }").getLayout("Commands", BuiltInLayouts.kList);
${ commands.map(c => indent(`commandList.add("${ c.name }", this.${ variableName(c.name) }Command(${ c.params.map(p => `/* ${ subsystem.actions.find(a => a.uuid === p.action).params.find(ap => ap.uuid === p.param).name } */`).join(", ") }));`, 8)).join("\n") }
      }

      // ACTIONS

${ subsystem.actions.map(a => indent(generateAction_future(a, subsystem), 6)).join("\n\n") }

      // STATES

${ subsystem.states.map(s => indent(generateState(s), 6)).join("\n\n") }

      // COMMANDS

${ commands.map(c => indent(generateCommand(c.name, subsystem, c.action, c.endCondition, c.params, c.toInitialize, c.toComplete, c.toInterrupt), 6)).join("\n\n") }
    }
    `
  );
}