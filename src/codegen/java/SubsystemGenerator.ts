import { Subsystem, SubsystemComponent } from "../../bindings/Command"
import { Project } from "../../bindings/Project"
import { className, fieldDeclaration, indent, methodName, objectName, prettify, unindent } from "./util"
import { generateCommand } from "./CommandGenerator"
import { generateState } from "./StateGenerator"
import { generateAction_future } from "./ActionGenerator"
import { Property } from "../../components/ComponentDefinition"
import { COMPONENT_DEFINITIONS } from "../../components/ComponentDefinitions"


function propertyToValue(property: Property, value, subsystem: Subsystem): string {
  const type = property.type
  console.debug('propertyToValue(', type, ', ', value, ', ', subsystem, ')')
  if (!type) return 'null'

  if (value === null || value === undefined || value === '') {
    if (property.defaultValue !== undefined) {
      return property.defaultValue
    }
    console.warn('No value provided!')
    return `/* You forgot to set a value for the ${ property.name }! */`
  }

  if (typeof value === 'string' && value.length === 36) {
    // might be a UUID for another component
    const maybeComp: SubsystemComponent = subsystem.components.find(c => c.uuid === value)
    if (maybeComp) {
      // it is! convert to a variable name for reference
      return objectName(maybeComp.name)
    } else {
      // Probably deleted a component reference by this one - make note of that instead of just pasting in the raw UUID
      return "/* Unknown component */"
    }
  } else if (Array.isArray(value)) {
    const joinedDefs = value.map(element => propertyToValue(property, element, subsystem))
    if (type.startsWith("vararg")) {
      return joinedDefs.join(", ")
    } else {
      return `new ${ type }[] { ${ joinedDefs.join(", ") } }`
    }
  }

  return value
}

function generatePropertySetting(subsystem: Subsystem, component: SubsystemComponent): string[] {
  const definition = component.definition
  // 1. Find all properties in the definition that are NOT set in the constructor
  // 2. Group by setter
  // 3. Find each param defined by the setter method and look up their values on the configured component properties
  // 4. Pass those values into the setter method in the order they're defined ON THE SETTER

  const properties = definition.properties.filter(p => !p.setInConstructor).filter(p => !!p.setter)
  const groupedProperties = properties.reduce((group, property) => {
    const { setter } = property
    group[setter.codeName] = group[setter.codeName] ?? []
    group[setter.codeName].push(property)
    return group
  }, {})

  Object.keys(groupedProperties).forEach(setterName => {
    const propsForSetter: Property[] = groupedProperties[setterName]
    if (propsForSetter.length === 0 ||
      propsForSetter.filter(p => Object.hasOwn(component.properties, p.codeName)).length === 0) {
      // No configured properties for this, kick it out
      console.debug('Not generating property setter for', setterName, 'because no configured properties exist that use it.')
      delete groupedProperties[setterName]
    }
  })

  const propertySetterCalls: string[] = Object.keys(groupedProperties).map(setterName => {
    const propertiesForSetter: Property[] = groupedProperties[setterName] // these should already be sorted in parameter order
    // Assuming no method overloading, we can just fetch the first setter method definition with this name
    const setter = propertiesForSetter[0].setter
    return `this.${ objectName(component.name) }.${ methodName(setter.name) }(${ propertiesForSetter.map(p => propertyToValue(p, component.properties[p.codeName], subsystem)).join(", ") });`
  })

  return propertySetterCalls
}

function generateComponentDefinition(component: SubsystemComponent, subsystem: Subsystem): string {
  const propertyValues = component.definition.properties.filter(c => c.setInConstructor).map(property => {
    const value = component.properties[property.codeName]

    if (property.wrapper) {
      const definition = COMPONENT_DEFINITIONS.forId(property.wrapper.definition)
      const wrapperProp = property.wrapper.propertyName
      // Generate an anonymous component to wrap the values
      const wrapperComponent = new SubsystemComponent(
        `<anonymous ${ definition.name } for ${ component.name } ${ property.name }>`,
        definition,
        { [wrapperProp]: value },
      )
      return generateComponentDefinition(wrapperComponent, subsystem)
    }

    return propertyToValue(property, value, subsystem)
  })

  return `new ${ component.definition.className }(${ propertyValues.join(", ") })`
}

export function generateSubsystem(subsystem: Subsystem, project: Project) {
  if (!subsystem || !project) return null

  const clazz = className(subsystem.name)

  const commands = subsystem.commands

  const subsystemFileContents = unindent(
    `
    package frc.robot.subsystems;

    import static edu.wpi.first.units.Units.*;

${ [...new Set(subsystem.components.map(c => c.definition.fqn))].sort().map(fqn => indent(`import ${ fqn };`, 4)).join("\n") }
    import edu.wpi.first.epilogue.Logged;
    import edu.wpi.first.units.*;
    import edu.wpi.first.wpilibj.shuffleboard.Shuffleboard;
    import edu.wpi.first.wpilibj.shuffleboard.ShuffleboardTab;
    import edu.wpi.first.wpilibj2.command.Command;
    import edu.wpi.first.wpilibj2.command.SubsystemBase;
    import edu.wpi.first.wpilibj2.command.button.Trigger;
    
    /**
     * The ${ subsystem.name } subsystem.
     */
    @Logged
    public class ${ clazz } extends SubsystemBase {

${ subsystem.components.map(c => indent(`${ fieldDeclaration(c.definition.className, c.name) };`, 6)).join("\n") }

${
  (() => {
    if (subsystem.states.length > 0) {
      return indent(
        unindent(`
          // These triggers can be used to activate commands when the ${ subsystem.name } enters a
          // certain state. This can be useful for coordinating hand offs between mechanisms, or for
          // simply notifying the drivers that something happened.
          `.trim(),
        ),
        6,
      )
    } else {
      return ''
    }
  })()
}
${ subsystem.states.map(state => {
    return indent(unindent(
      `
      @NotLogged
      public final Trigger ${ methodName(state.name) } = new Trigger(this::${ methodName(state.name) });
    `,
    ).trim(), 6)
  }).join("\n") }

      public ${ clazz }() {
${
  subsystem.components.map(c => indent(`this.${ objectName(c.name) } = ${ generateComponentDefinition(c, subsystem) };`, 8),
  ).join("\n")
}

${
  subsystem.components.flatMap(c => generatePropertySetting(subsystem, c)).map(setter => indent(setter, 8))
    .join("\n")
}

      }

      // ACTIONS
      // Note: actions are private methods by default. This is for safety. Anything that a subsystem does
      // should be performed using a command, and a subsystem can only have one command running at a time.
      // Raw methods like these have no such protections, and should only be used internally where the
      // subsystem code can guarantee they are used safely.

${
  subsystem.actions.map(action => unindent(indent(generateAction_future(action, subsystem), 4)).trim())
    .map(f => indent(f, 6)).join("\n\n")
}

      // STATES

${
  subsystem.states.map(state => unindent(indent(generateState(state, subsystem), 4)).trim())
    .map(f => indent(f, 6)).join("\n\n")
}

      // COMMANDS

${
  commands.map(c => indent(generateCommand(c.name, subsystem, c.action, c.endCondition, c.params, c.toInitialize), 6))
    .join("\n\n")
}
    }
    `,
  )

  return prettify(subsystemFileContents)
}
