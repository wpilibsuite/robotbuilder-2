import { PassthroughValueStepArgument, Subsystem, SubsystemAction, SubsystemActionStep } from "../../bindings/Command";
import { codeBlock, indent, methodName, variableName } from "./util";

export function generateAction(action: SubsystemAction): string {
  return codeBlock(
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
  );
}

const varNameForStepOutput = (stepOrUuid: SubsystemActionStep | string, previousSteps: SubsystemActionStep[], subsystem: Subsystem) => {
  let step: SubsystemActionStep;
  if (typeof stepOrUuid === 'string') {
    step = previousSteps.find(s => s.uuid === stepOrUuid);
  } else {
    step = stepOrUuid as SubsystemActionStep;
  }

  const stepNum = previousSteps.indexOf(step) + 1;
  const component = subsystem.components.find(c => c.uuid === step.component);
  // TODO: Better variable names!
  return variableName(`step${ stepNum } ${ variableName(component.name) } ${ variableName(component.definition.methods.find(m => m.codeName === step.methodName).name) }`);
}

export function generateStepParams(steps: SubsystemActionStep[], subsystem: Subsystem): string[] {
  return steps
    .flatMap(step => {
      console.debug('Generating parameters for step', step);
      const params = step.params.filter(p => p.arg.type === "define-passthrough-value");
      console.debug('  Params:', params);
      const component = subsystem.components.find(c => c.uuid === step.component);
      console.debug('  Component:', component);
      if (!component) {
        // throw new Error(`Couldn't find component for UUID ${ step.component } in subsystem components: ${ subsystem.components.map(c => `"${ c.name }"/${ c.uuid }`) }`);
        return null;
      }
      const method = component.definition.methods.find(m => m.codeName === step.methodName);
      return params.map(stepParam => {
        const param = method.parameters.find(p => p.codeName === stepParam.paramName);
        if (param) {
          return `${ param.type } ${ variableName((stepParam.arg as PassthroughValueStepArgument).passthroughArgumentName) }`;
        } else {
          return null;
        }
      })
    })
    .filter(p => !!p);
}

export function generateStepInvocations(steps: SubsystemActionStep[], subsystem: Subsystem): string[] {
  return steps.map((step, i) => {
    const component = subsystem.components.find(c => c.uuid === step.component);
    const methodDef = component?.definition.methods.find(m => m.codeName === step.methodName);

    if (!component || !methodDef) {
      // not enough info - could be that the user is actively editing the step
      console.warn('[GENERATE-STEP-INVOCATION] Could not find component and/or method', component, methodDef);
      return null;
    }

    // Checks if we need to store the output of this step in a variable so later steps can reference it
    const outputRequired = steps.slice(i + 1).find((futureStep) => futureStep.params.find(p => p.arg.type === "reference-step-output" && p.arg.step === step.uuid));
    let varDef = '';
    if (outputRequired) {
      // Store output in a final variable
      // Use the return type for clarity - `final var` isn't helpful when a lot of method names don't imply a particular return type
      // (though it's typically going to be doubles)
      varDef = `${ methodDef.returns } ${ varNameForStepOutput(step, steps, subsystem) } = `;
    }

    const args = step.params.map(param => {
      const arg = param.arg;
      switch (arg.type) {
        case "hardcode":
          return arg.hardcodedValue;
        case "define-passthrough-value":
          return variableName(arg.passthroughArgumentName);
        case "reference-passthrough-value":
          const referencedStep = steps.find(s => s.uuid === arg.step);
          const referencedParam = referencedStep.params.find(p => p.paramName === arg.paramName);
          if (referencedParam)
            return variableName((referencedParam.arg as PassthroughValueStepArgument).passthroughArgumentName);
          else {
            console.error('Undefined param on argument!', arg);
            return `/* couldn't find param ${ arg.paramName } on ${ referencedStep.methodName } */`;
          }
        case "reference-step-output":
          return varNameForStepOutput(arg.step, steps, subsystem);
        default:
          return `/* You forgot to specify a value for ${ param.paramName }! */`;
      }
    });

    const invocation = `${ step.methodName }(${ args.join(", ") });`;

    return `${ varDef }${ variableName(component.name) }.${ invocation }`;
  });
}

export function generateAction_future(action: SubsystemAction, subsystem: Subsystem): string {
  const steps = action.steps;
  const paramDefs = generateStepParams(steps, subsystem);
  const stepInvocations = generateStepInvocations(steps, subsystem);

  return codeBlock(
    `
    public void ${ action.name && action.name.length > 0 ? methodName(action.name) : 'unnamedAction' }(${ paramDefs.join(", ") }) {
${ stepInvocations.length > 0 ? stepInvocations.filter(i => !!i).map(invoke => indent(invoke, 6)).join("\n") : indent('// Add your custom logic here!', 6) }
    }
    `
  );
}
