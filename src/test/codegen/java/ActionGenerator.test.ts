import { Subsystem, SubsystemActionStep, SubsystemComponent } from "../../../bindings/Command";
import { ComponentDefinition } from "../../../components/ComponentDefinition";
import { generateAction_future } from "../../../codegen/java/ActionGenerator";

const GENERIC_ACTUATOR: ComponentDefinition = {
  name: "Generic Actuator",
  className: "GenericActuator",
  fqn: "com.example.GenericActuator",
  hints: ["action"],
  id: "generic-actuator",
  methods: [
    {
      name: "Set Value",
      description: "",
      codeName: "setValue",
      hints: ["action"],
      parameters: [
        {
          name:  "Value",
          description: "",
          codeName: "value",
          type: "double"
        }
      ],
      returns: "void"
    },
    {
      name: "Get Value",
      description: "",
      codeName: "getValue",
      hints: ["state"],
      parameters: [],
      returns: "double"
    }
  ],
  properties: [],
  type: "actuator",
  wpilibApiTypes: ["MotorController"]
}

const GENERIC_SENSOR: ComponentDefinition = {
  name: "Generic Sensor",
  className: "GenericSensor",
  fqn: "com.example.GenericSensor",
  hints: ["state", "action"],
  id: "generic-sensor",
  methods: [
    {
      name: "Get Position",
      description: "",
      codeName: "getPosition",
      hints: ["state", "action"],
      parameters: [],
      returns: "double"
    }
  ],
  properties: [],
  type: "sensor",
  wpilibApiTypes: []
}

const GENERIC_CONTROLLER: ComponentDefinition = {
  name: "Generic Controller",
  className: "GenericController",
  fqn: "com.example.GenericController",
  hints: ["action"],
  id: "generic-controller",
  methods: [
    {
      name: "Calculate",
      description: "",
      codeName: "calculate",
      hints: ["action"],
      parameters: [
        {
          name: "Current Position",
          description: "The current position of the system to use to determine the output of the controller",
          codeName: "currentPosition",
          type: "double"
        }
      ],
      returns: "double"
    }
  ],
  properties: [],
  type: "control",
  wpilibApiTypes: []
}

test("Generates implementation with a passthrough value", () => {
  const subsystem = new Subsystem();
  subsystem.name = "Subsystem";

  const actuator = new SubsystemComponent("Actuator", GENERIC_ACTUATOR, {});
  subsystem.components.push(actuator);

  const action = subsystem.createAction("An Action");
  const step1 = new SubsystemActionStep({
    component: actuator.uuid,
    methodName: "setValue",
    params: [
      {
        paramName: "value",
        arg: {
          type: "define-passthrough-value",
          passthroughArgumentName: "valuePassedToActuatorSetValueMethod"
        }
      }
    ],
    uuid: "step-1-setValue"
  });

  action.steps = [
    step1
  ];

  const output = generateAction_future(action, subsystem);
  console.log(output);

  expect(output).toEqual((
`public void anAction(double valuePassedToActuatorSetValueMethod) {
  this.actuator.setValue(valuePassedToActuatorSetValueMethod);
}`
  ))
});

test("Generates implementation with a hardcoded value", () => {
  const subsystem = new Subsystem();
  subsystem.name = "Subsystem";

  const actuator = new SubsystemComponent("Actuator", GENERIC_ACTUATOR, {});
  subsystem.components.push(actuator);

  const action = subsystem.createAction("An Action");
  const step1 = new SubsystemActionStep({
    component: actuator.uuid,
    methodName: "setValue",
    params: [
      {
        paramName: "value",
        arg: {
          type: "hardcode",
          hardcodedValue: "Double.MAX_VALUE"
        }
      }
    ],
    uuid: "step-1-setValue"
  });

  action.steps = [
    step1
  ];

  const output = generateAction_future(action, subsystem);
  console.log(output);

  expect(output).toEqual((
    `public void anAction() {
  this.actuator.setValue(Double.MAX_VALUE);
}`
  ))
});

test("Generates implementation that references an argument defined by a prior step", () => {
  const subsystem = new Subsystem();
  subsystem.name = "Subsystem";

  const actuator = new SubsystemComponent("Actuator", GENERIC_ACTUATOR, {});
  subsystem.components.push(actuator);

  const action = subsystem.createAction("An Action");
  const step1 = new SubsystemActionStep({
    component: actuator.uuid,
    methodName: "setValue",
    params: [
      {
        paramName: "value",
        arg: {
          type: "define-passthrough-value",
          passthroughArgumentName: "valuePassedToActuatorSetValueMethod"
        }
      }
    ],
    uuid: "step-1-setValue"
  });
  const step2 = new SubsystemActionStep({
    component: actuator.uuid,
    methodName: "setValue",
    params: [
      {
        paramName: "value",
        arg: {
          type: "reference-passthrough-value",
          step: step1.uuid,
          paramName: "value"
        }
      }
    ],
    uuid: "step-2-setValue"
  });

  action.steps = [
    step1,
    step2
  ];

  const output = generateAction_future(action, subsystem);
  console.log(output);

  expect(output).toEqual((
    `public void anAction(double valuePassedToActuatorSetValueMethod) {
  this.actuator.setValue(valuePassedToActuatorSetValueMethod);
  this.actuator.setValue(valuePassedToActuatorSetValueMethod);
}`
  ))
});

test("Generates an implementation that references the output of a previous step", () => {
  const subsystem = new Subsystem();
  subsystem.name = "Subsystem";

  const actuator = new SubsystemComponent("Actuator", GENERIC_ACTUATOR, {});
  const sensor = new SubsystemComponent("Sensor", GENERIC_SENSOR, {});
  const controller = new SubsystemComponent("Controller", GENERIC_CONTROLLER, {});
  subsystem.components.push(actuator, sensor, controller);

  const action = subsystem.createAction("An Action");
  const step1 = new SubsystemActionStep({
    component: sensor.uuid,
    methodName: "getPosition",
    params: [],
    uuid: "step-1-getPosition"
  });
  const step2 = new SubsystemActionStep({
    component: controller.uuid,
    methodName: "calculate",
    params: [
      {
        paramName: "currentPosition",
        arg: {
          type: "reference-step-output",
          step: step1.uuid
        }
      }
    ],
    uuid: "step-2-calculate-controller"
  });
  const step3 = new SubsystemActionStep({
    component: actuator.uuid,
    methodName: "setValue",
    params: [
      {
        paramName: "value",
        arg: {
          type: "reference-step-output",
          step: step2.uuid
        }
      }
    ],
    uuid: "step-3-setValue"
  });

  action.steps = [step1, step2, step3];

  const output = generateAction_future(action, subsystem);
  console.log(output);

  expect(output).toEqual((
    `public void anAction() {
  final double step1SensorGetPosition = this.sensor.getPosition();
  final double step2ControllerCalculate = this.controller.calculate(step1SensorGetPosition);
  this.actuator.setValue(step2ControllerCalculate);
}`
  ))
});
