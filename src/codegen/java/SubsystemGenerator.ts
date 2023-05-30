import { Subsystem, SubsystemComponent } from "../../bindings/Command";
import { Project } from "../../bindings/Project";
import { className, constantName, fieldDeclaration, indent, methodName, objectName, prettify, unindent } from "./util";
import { generateCommand } from "./CommandGenerator";
import { generateState } from "./StateGenerator";
import { generateAction_future, generateStepParams } from "./ActionGenerator";
import { Property } from "../../components/ComponentDefinition";
import { COMPONENT_DEFINITIONS } from "../../components/ComponentDefinitions";


function propertyToValue(property: Property, value: string | any[], subsystem: Subsystem): string {
  const type = property.type;
  console.debug('propertyToValue(', type, ', ', value, ', ', subsystem, ')');
  if (!type) return 'null';

  if (value === null || value === undefined || value === '') {
    if (property.defaultValue !== undefined) {
      return property.defaultValue;
    }
    console.warn('No value provided!');
    return "/* You forgot to set a value! */";
  }

  if (typeof value === 'string' && value.length === 36) {
    // might be a UUID for another component
    const maybeComp: SubsystemComponent = subsystem.components.find(c => c.uuid === value);
    if (maybeComp) {
      // it is! convert to a variable name for reference
      return objectName(maybeComp.name);
    } else {
      // Probably deleted a component reference by this one - make note of that instead of just pasting in the raw UUID
      return "/* Unknown component */";
    }
  } else if (Array.isArray(value)) {
    const joinedDefs = value.map(element => propertyToValue(property, element, subsystem));
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
    return `this.${ objectName(component.name) }.${ methodName(setter.name) }(${ propertiesForSetter.map(p => propertyToValue(p, component.properties[p.codeName], subsystem)).join(", ") });`;
  });

  return propertySetterCalls;
}

function generateComponentDefinition(component: SubsystemComponent, subsystem: Subsystem): string {
  const propertyValues = component.definition.properties.filter(c => c.setInConstructor).map(property => {
    const value = component.properties[property.codeName];

    if (property.wrapper) {
      const definition = COMPONENT_DEFINITIONS.forId(property.wrapper.definition);
      const wrapperProp = property.wrapper.propertyName;
      // Generate an anonymous component to wrap the values
      const wrapperComponent = new SubsystemComponent(
        `<anonymous ${ definition.name } for ${ component.name } ${ property.name }>`,
        definition,
        { [wrapperProp]: value }
      );
      return generateComponentDefinition(wrapperComponent, subsystem);
    }

    return propertyToValue(property, value, subsystem);
  });

  return `new ${ component.definition.className }(${ propertyValues.join(", ") })`;
}

function generateSubsystemIOInterface(subsystem: Subsystem, project: Project): string {
  const interfaceContent = unindent(
    `
    /**
     * The generic IO interface. The ${ subsystem.name } subsystem uses an IO object
     * that implements this interface to interact with the world. Typically, there are
     * at least two implementations - one concrete implementation that uses real
     * hardware and interacts with the real world, and one implementation for simulation
     * that interacts with a model of the real world instead.
     *
     * @see {@link Real${ className(subsystem.name) }IO}
     */
    public interface ${ className(subsystem.name ) }IO {
${
  subsystem.actions.map(action => {
    return `void ${ methodName(action.name) }(${ generateStepParams(action.steps, subsystem).join(', ') });`
  }).join("\n") }

  ${
  subsystem.states.map(state => {
    return `boolean ${ methodName(state.name) }();`
  }).join("\n")
}
    }
    `
  );

  return prettify(interfaceContent);
}

function generateConcreteSubsystemIO(subsystem: Subsystem, project: Project): string {
  const classContent = unindent(
    `
      /**
       * An implementation of {@link ${ className(subsystem.name) }IO} that interacts
       * with the real world through physical hardware.
       */
      public static final class Real${ className(subsystem.name) }IO implements ${ className(subsystem.name) }IO {
${ subsystem.components.map(c => indent(`${ fieldDeclaration(c.definition.className, c.name) };`, 8)).join("\n") }

        public Real${ className(subsystem.name) }IO() {
${ subsystem.components.map(c => indent(`this.${ objectName(c.name) } = ${ generateComponentDefinition(c, subsystem) };`, 10)).join("\n") }

${ subsystem.components.flatMap(c => generatePropertySetting(subsystem, c)).map(setter => indent(setter, 10)).join("\n") }
        }

${ subsystem.actions.map(action => {
  return unindent(
    `
      @Override
${ indent(generateAction_future(action, subsystem), 6) }
    `
  ).trim()
        }).map(f => indent(f, 8)).join("\n\n")
}

${ subsystem.states.map(state => {
  return unindent(
    `
      @Override
${ indent(generateState(state, subsystem), 6) }
    `
  ).trim()
}).map(f => indent(f, 8)).join("\n\n") }
      }
    `
  ).trim();

  return prettify(classContent);
}

function generateSimSubsystemIO(subsystem: Subsystem, project: Project): string {
  const subsystemClass = className(subsystem.name);
  const ioInterface = `${ subsystemClass }IO`;
  const simClass = `Sim${ subsystemClass }IO`;
  const classContent = unindent(
    `
    /**
     * An implementation of {@link ${ ioInterface }} that interacts
     * with a model of the real world and control hardware.
     */
    public static final class ${ simClass } implements ${ ioInterface } {
      private static final double PERIODIC_TIMESTEP = 0.020; // Seconds

      /**
       * Updates all simulation devices.
       */
      public void update() {
        // TODO
      }

${ subsystem.actions.map(action => {
    return unindent(
      `
        @Override
        public void ${ methodName(action.name) }() {
          // TODO
        }
      `
    ).trim()
  }).map(f => indent(f, 8)).join("\n\n") }

${ subsystem.states.map(state => {
    return unindent(
      `
        @Override
        public boolean ${ methodName(state.name) }() {
          // TODO
        }
      `
    ).trim()
  }).map(f => indent(f, 8)).join("\n\n") }
    }
    `
  ).trim();

  return prettify(classContent);
}

export function generateSubsystem(subsystem: Subsystem, project: Project) {
  if (!subsystem || !project) return null;

  let clazz = className(subsystem.name);

  const commands = subsystem.commands;

  const subsystemFileContents = unindent(
    `
    package frc.robot.subsystems;

${ [...new Set(subsystem.components.map(c => c.definition.fqn))].sort().map(fqn => indent(`import ${ fqn };`, 4)).join("\n") }

    /**
     * The ${ subsystem.name } subsystem.
     */
    public class ${ clazz } extends SubsystemBase {
      private final ${ className(subsystem.name) }IO io;

      private final ShuffleboardTab tab = Shuffleboard.getTab("${ subsystem.name }");

      public ${ clazz }(${ className(subsystem.name) }IO io) {
        this.io = io;

        // Dashboard settings
        setName("${ subsystem.name }");

        var commandList = tab.getLayout("Commands", BuiltInLayouts.kList);
${ subsystem.commands.filter(c => c.params.length === 0).map(c => indent(`commandList.add("${ c.name }", this.${ methodName(c.name) }());`, 8)).join("\n") }
      }

      @Override
      public void simulationPeriodic() {
        // This should be in the main robot class
        if (this.io instanceof Sim${ className(subsystem.name) }IO simIO) {
          simIO.update();
        }
      }

      // IO

${ indent(generateSubsystemIOInterface(subsystem, project), 6) }

${ indent(generateConcreteSubsystemIO(subsystem, project), 6) }

${ indent(generateSimSubsystemIO(subsystem, project), 6) }

      // STATES
${ subsystem.states.map(state => {
  return indent(unindent(
    `
      public boolean ${ methodName(state.name) }() {
        return io.${ methodName(state.name) }();
      }
    `
  ).trim(), 6)
}).join("\n\n") }

      // COMMANDS

${ commands.map(c => indent(generateCommand(c.name, subsystem, c.action, c.endCondition, c.params, c.toInitialize, c.toComplete, c.toInterrupt), 6)).join("\n\n") }
    }
    `
  );

  return prettify(subsystemFileContents);
}
