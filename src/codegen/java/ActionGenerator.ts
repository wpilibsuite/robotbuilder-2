import { PassthroughValueStepArgument, Subsystem, SubsystemAction, SubsystemActionStep } from "../../bindings/Command";
import { codeBlock, indent, methodName, unindent, variableName } from "./util";

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

export function generateAction_future(action: SubsystemAction, subsystem: Subsystem): string {
  const paramDefs = action.steps
    .flatMap(step => {
      console.debug('Generating parameters for step', step);
      const params = step.params.filter(p => p.arg.type === "define-passthrough-value");
      console.debug('  Params:', params);
      const component = subsystem.components.find(c => c.uuid === step.component);
      console.debug('  Component:', component);
      if (!component) {
        throw new Error(`Couldn't find component for UUID ${ step.component } in subsystem components: ${ subsystem.components.map(c => `"${ c.name }"/${ c.uuid }`) }`);
      }
      const method = component.definition.methods.find(m => m.codeName === step.methodName);
      return params.map(stepParam => {
        const param = method.parameters.find(p => p.codeName === stepParam.paramName);
        return {
          type: param.type,
          name: (stepParam.arg as PassthroughValueStepArgument).passthroughArgumentName
        };
      })
    });

  const varNameForStepOutput = (stepOrUuid: SubsystemActionStep | string) => {
    let step: SubsystemActionStep;
    if (typeof stepOrUuid === 'string') {
      step = action.steps.find(s => s.uuid === stepOrUuid);
    } else {
      step = stepOrUuid as SubsystemActionStep;
    }

    const stepNum = action.steps.indexOf(step) + 1;
    const component = subsystem.components.find(c => c.uuid === step.component);
    // TODO: Better variable names!
    return variableName(`step${ stepNum } ${ variableName(component.name) } ${ variableName(step.methodName) }`);
  }

  const stepInvocations = action.steps.map((step, i) => {
    const component = subsystem.components.find(c => c.uuid === step.component);
    const methodDef = component.definition.methods.find(m => m.codeName === step.methodName);
    // Checks if we need to store the output of this step in a variable so later steps can reference it
    const outputRequired = action.steps.slice(i + 1).find((futureStep) => futureStep.params.find(p => p.arg.type === "reference-step-output" && p.arg.step === step.uuid));
    let varDef = '';
    if (outputRequired) {
      // Store output in a final variable
      // Use the return type for clarity - `final var` isn't helpful when a lot of method names don't imply a particular return type
      // (though it's typically going to be doubles)
      varDef = `final ${ methodDef.returns } ${ varNameForStepOutput(step) } = `;
    }

    const args = step.params.map(param => {
      const arg = param.arg;
      switch (arg.type) {
        case "hardcode":
          return arg.hardcodedValue;
        case "define-passthrough-value":
          return variableName(arg.passthroughArgumentName);
        case "reference-passthrough-value":
          const referencedStep = action.steps.find(s => s.uuid === arg.step);
          const referencedParam = referencedStep.params.find(p => p.paramName === arg.paramName);
          return variableName((referencedParam.arg as PassthroughValueStepArgument).passthroughArgumentName);
        case "reference-step-output":
          return varNameForStepOutput(arg.step);
        default:
          return `/* You forgot to specify a value for ${ param.paramName }! */`;
      }
    });

    const invocation = `${ step.methodName }(${ args.join(", ") });`;

    return `${varDef}this.${ variableName(component.name) }.${invocation}`;
  });

  return codeBlock(
    `
    public void ${ methodName(action.name) }(${ paramDefs.map(def => `${ def.type } ${ variableName(def.name) }`).join(", ") }) {
${ stepInvocations.map(invoke => indent(invoke, 6)).join("\n") }
    }
    `
  );
}
