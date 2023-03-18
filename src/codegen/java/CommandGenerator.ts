import { ActionParamCallOption, EndCondition, Param, Subsystem } from "../../bindings/Command";
import { methodName, unindent, variableName } from "./util";

export function generateParam(param: Param, invocation: ActionParamCallOption): string {
  switch (invocation.invocationType) {
    case "passthrough-value":
      console.log('Passthrough by value', param, invocation);
      return `${ param.type } ${ variableName(param.name) }`;
    case "passthrough-supplier":
      console.log('Passthrough by supplier', param, invocation);
      let supplierType = `Supplier<${ param.type }>`;
      switch (param.type) {
        case "boolean":
          supplierType = 'BooleanSupplier';
          break;
        case "int":
          supplierType = "IntegerSupplier";
          break;
        case "long":
          supplierType = "LongSupplier";
          break;
        case "double":
          supplierType = "DoubleSupplier";
          break;
        default:
          supplierType = `Supplier<${ param.type }>`;
          break;
      }
      return `${ supplierType } ${ variableName(param.name) }`;
    default:
      // Shouldn't end up here, but it's good to have a default just in case
      return "/* hardcoded */";
  }
}

export function generateActionParamValue(param: Param, invocation: ActionParamCallOption) {
  if (invocation) {
    switch (invocation.invocationType) {
      case "hardcode":
        // Easiest case.  Assumes the hardcoded value is valid Java code
        return invocation.hardcodedValue;
      case "passthrough-value":
        // Value is provided by a parameter to the command factory method.
        // Assumes the parameter in the factory has the same name as the parameter on the action!
        return variableName(param.name);
      case "passthrough-supplier":
        const paramName = variableName(param.name);
        let supplierInvocation;
        switch (param.type) {
          case "boolean":
            supplierInvocation = "getAsBoolean()";
            break;
          case "int":
            supplierInvocation = "getAsInt()";
            break;
          case "long":
            supplierInvocation = "getAsLong()";
            break;
          case "double":
            supplierInvocation = "getAsDouble()";
            break;
          default:
            // Assume the type is a Java class and we'd be supplied an Object
            supplierInvocation = "get()";
            break;
        }
        return `${ paramName }.${ supplierInvocation }`;
      default:
        // Whoops, something went wrong somewhere...
        return `/* Unsupported invocation type "${ invocation.invocationType }"! Open a bug report! */`;
    }
  } else {
    // Haven't defined an invocation yet - indicate that it's needed!
    return `/* Unspecified ${ param.name } */`;
  }
}

/**
 * Generates a Java command method using the fluent API.  The method is expected to be defined in the body
 * of a subsystem class.
 *
 * For example:
 * generateCommand(
 *   "foo",
 *   exampleSubsystem,
 *   "example-subsystem-foo-action-uuid",
 *   "forever",
 *   [
 *     { param: "foo-action-x-param-uuid", invocationType: "passthrough-value" },
 *     { param: "foo-action-y-param-uuid", invocationType: "passthrough-value" }
 *   ]
 * )
 *
 * Generates this code:
 * public CommandBase fooCommand(double x, double y) {
 *   return this.run(() -> this.fooAction(x, y));
 * }
 */
export function generateCommand(name: string, subsystem: Subsystem, actionUuid: string, endCondition: EndCondition, commandParams: ActionParamCallOption[]): string {
  if (!name || !subsystem || !actionUuid || !endCondition) {
    // Not enough information, bail
    return '';
  }

  const action = subsystem.actions.find(a => a.uuid === actionUuid);
  if (!action) {
    // Couldn't find the action we'd be invoking!
    return '';
  }

  console.debug('Generating Java command code for command', name, 'subsystem', subsystem.name, 'action', actionUuid, 'end condition', endCondition, 'with params', commandParams);

  const subsystemVar = 'this';
  const actionMethod = methodName(action.name);
  let paramDefs = '';
  if (commandParams.length > 0) {
    // All passthrough invocations require parameters on the command factory
    // Hardcoded values are, obviously, hardcoded in the method body
    paramDefs = commandParams.filter(p => p.invocationType !== "hardcode").map(invocation => {
      const param = action.params.find(p => p.uuid === invocation.param);
      return generateParam(param, invocation);
    }).join(", ");
  }

  // Return a CommandBase because it implements the Sendable interface, while Command doesn't
  const commandDef = `public CommandBase ${ variableName(name) }Command(${ paramDefs })`;

  let actionInvocation;
  if (action.params.length === 0) {
    // No parameters to pass through, use a method reference instead of a lambda
    // eg `this::fooAction` instead of `() -> this.fooAction()`
    actionInvocation = `${ subsystemVar }::${ actionMethod }`;
  } else {
    actionInvocation = `() -> ${ subsystemVar }.${ actionMethod }(${ action.params.map(param => generateActionParamValue(param, commandParams.find(c => c.param === param.uuid))).join(', ') })`;
  }

  switch (endCondition) {
    case "forever":
      return (
        unindent(
          `
          /**
           * The ${ name } command.  This will run the ${ action.name } action and will
           * only stop if it is canceled or another command that requires the ${ subsystem.name } is started.
           */
          ${ commandDef } {
            return ${ subsystemVar }.run(${ actionInvocation });
          }
          `
        ).trimStart().trimEnd()
      );
    case "once":
      return (
        unindent(
          `
          /**
           * The ${ name } command.  This will run the ${ action.name } action once and then immediately finish.
           */
          ${ commandDef } {
            return ${ subsystemVar }.runOnce(${ actionInvocation });
          }
          `
        ).trimStart().trimEnd()
      );
    default:
      // command state uuid
      const endState = subsystem.states.find(s => s.uuid === endCondition);
      const stateName = endState.name;
      return (
        unindent(
          `
          /**
           * The ${ name } command.  This will run the ${ action.name } action until the ${ subsystem.name }
           * has ${ stateName }.
           */
          ${ commandDef } {
            return ${ subsystemVar }
                     .run(${ actionInvocation })
                     .until(${ subsystemVar }::${ methodName(stateName) });
          }
          `
        ).trimStart().trimEnd()
      );
  }
}