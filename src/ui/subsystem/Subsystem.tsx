import { Project } from "../../bindings/Project";
import {
  ActionParamCallOption,
  AtomicCommand,
  EndCondition,
  Param,
  StepArgument,
  StepParam,
  Subsystem,
  SubsystemAction,
  SubsystemActionStep,
  SubsystemComponent,
  SubsystemState
} from "../../bindings/Command";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, Divider, FormControl, InputLabel,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField, Tooltip
} from "@mui/material";
import React, { CSSProperties, useEffect, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SyntaxHighlighter from 'react-syntax-highlighter';
import * as SyntaxHighlightStyles from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ComponentDefinition, MethodDefinition, ParameterDefinition } from "../../components/ComponentDefinition";
import { COMPONENT_DEFINITIONS } from "../../components/ComponentDefinitions";
import { generateCommand } from "../../codegen/java/CommandGenerator";
import { generateSubsystem } from "../../codegen/java/SubsystemGenerator";
import { ComponentLane } from "./ComponentLane";
import { v4 as uuidV4 } from "uuid"
import { generateAction_future } from "../../codegen/java/ActionGenerator";


type BasicOpts = {
  subsystem: Subsystem;
  project: Project;
}

function SensorsLane({
                       sensors,
                       onChange
                     }: { sensors: SubsystemComponent[], onChange: (newSensors: SubsystemComponent[]) => void }) {
  return (
    <Box className="subsystem-lane sensors-lane">
      <h3>Sensors</h3>
      <Box className="subsystem-lane-items">
        {
          sensors.map(sensor => {
            return (
              <Card key={ sensor.uuid } className="subsystem-lane-item" component={ Paper }>
                { sensor.name }
              </Card>
            )
          })
        }
        <Button disabled>
          + Add Sensor
        </Button>
      </Box>
    </Box>
  );
}

function ControlsLane({ subsystem, project }: BasicOpts) {
  return (
    <Box className="subsystem-lane controls-lane">
      <h3>Controls</h3>
      <Box className="subsystem-lane-items">
        {
          subsystem.getControls().map(component => {
            return (
              <Card key={ component.uuid } className="subsystem-lane-item" component={ Paper }>
                { component.name }
              </Card>
            )
          })
        }
        <Button disabled>
          + Add Control
        </Button>
      </Box>
    </Box>
  );
}

function SubsystemPane({ subsystem, project }: BasicOpts) {
  const [generatedCode, setGeneratedCode] = useState(generateSubsystem(subsystem, project));
  const [sensors, setSensors] = useState(subsystem.getSensors());
  const [actuators, setActuators] = useState(subsystem.getActuators());
  const [controls, setControls] = useState(subsystem.getControls());
  const [actions, setActions] = useState(subsystem.actions);
  const [states, setStates] = useState(subsystem.states);
  const [commands, setCommands] = useState(subsystem.commands);

  useEffect(() => setGeneratedCode(generateSubsystem(subsystem, project)), [subsystem, project, sensors, actuators, controls, actions, states, commands]);
  useEffect(() => {
    setSensors(subsystem.getSensors());
    setActuators(subsystem.getActuators());
    setControls(subsystem.getControls());
    setActions(subsystem.actions);
    setStates(subsystem.states);
    setCommands(subsystem.commands);
  }, [subsystem, project]);

  return (
    <Box className="subsystem-pane" style={ {} }>
      <ComponentLane subsystem={ subsystem }
                     componentType="sensor"
                     components={ sensors }
                     onChange={ (newSensors) => {
                       console.log('Setting sensors to', newSensors);
                       const added = newSensors.filter(a => !subsystem.components.includes(a))
                       const removed = subsystem.getSensors().filter(a => !newSensors.includes(a));
                       subsystem.components = subsystem.components.filter(c => c.type !== "sensor" || !removed.includes(c)).concat(...added);
                       setSensors(newSensors);
                     } }/>
      <ComponentLane subsystem={ subsystem }
                     componentType="actuator"
                     components={ actuators }
                     onChange={ (newActuators) => {
                       console.log('Setting actuators to', newActuators);
                       const added = newActuators.filter(a => !subsystem.components.includes(a))
                       const removed = subsystem.getActuators().filter(a => !newActuators.includes(a));
                       subsystem.components = subsystem.components.filter(c => c.type !== "actuator" || !removed.includes(c)).concat(...added);
                       setActuators(newActuators);
                     } }/>
      <ComponentLane subsystem={ subsystem }
                     componentType="control"
                     components={ controls }
                     onChange={ (newControls) => {
                       console.log('Setting controls to', newControls);
                       const added = newControls.filter(a => !subsystem.components.includes(a))
                       const removed = subsystem.getControls().filter(a => !newControls.includes(a));
                       subsystem.components = subsystem.components.filter(c => c.type !== "control" || !removed.includes(c)).concat(...added);
                       setControls(newControls);
                     } }/>
      <ActionsLane subsystem={ subsystem }
                   actions={ actions }
                   onChange={ (newActions) => {
                     subsystem.actions = [...newActions];
                     setActions(subsystem.actions);
                   } }/>
      <StatesLane subsystem={ subsystem }
                  states={ states }
                  onChange={ (newStates) => {
                    subsystem.states = [...newStates];
                    setStates(subsystem.states);
                  } }/>
      <CommandsLane subsystem={ subsystem }
                    commands={ commands }
                    onChange={ (newCommands) => {
                      // TODO: Update the project.  Maybe?  Project shouldn't know about subsystem's commands...
                      subsystem.commands = newCommands;
                      setCommands(newCommands);
                    } }/>
      <SyntaxHighlighter
        language="java"
        style={ SyntaxHighlightStyles.vs }
        showLineNumbers={ true }
        wrapLines={ true }
        lineProps={ (lineNumber: number): { style: React.CSSProperties } => {
          const style: CSSProperties = { display: "block" };
          const lineContent = generatedCode.split("\n")[lineNumber - 1];
          if (lineContent === "  // ACTIONS") {
            style.backgroundColor = "#cfc";
          } else if (lineContent === "  // STATES") {
            style.backgroundColor = "#cfc";
          } else if (lineContent === "  // COMMANDS") {
            style.backgroundColor = "#cfc";
          }
          return { style };
        } }
      >
        { generatedCode }
      </SyntaxHighlighter>
    </Box>
  );
}


type StepEditorProps = {
  subsystem: Subsystem,
  component: SubsystemComponent,
  methodName: string,
  params: StepParam[],
  previousSteps: SubsystemActionStep[];
  onMethodChange: (component: SubsystemComponent, methodName: string, params: StepParam[]) => void,
};

function StepEditor({
                      subsystem,
                      component,
                      methodName,
                      params,
                      previousSteps,
                      onMethodChange
                    }: StepEditorProps) {

  const buildDummyParams = (component: SubsystemComponent, methodName: string): StepParam[] => {
    const method = component.definition.methods.find(m => m.codeName === methodName);
    if (!method) return [];

    return method.parameters.map(param => {
      return {
        paramName: param.codeName,
        arg: {
          type: "hardcode",
          hardcodedValue: "/* TODO */"
        }
      }
    })
  }

  useEffect(() => {
    console.debug('[STEP-EDITOR] Rendering step editor for step using component', component, 'with method', methodName);
  });

  return (
    <Box className="step-editor">
      <span>
        Using
        <Select variant="standard"
                style={{ margin: "0 8px" }}
                value={ component?.uuid ?? '' }
                onChange={ (e) => {
                  const componentUuid = e.target.value;
                  const newComponent = subsystem.components.find(c => c.uuid === componentUuid);
                  onMethodChange(newComponent, null, []);
                } }>
          {
            subsystem.components.map(c => {
              return (
                <MenuItem key={ c.uuid } value={ c.uuid }>
                  <span style={{ textTransform: "uppercase", color: "blue" }}>
                    { c.name }
                  </span>
                </MenuItem>
              );
            })
          }
        </Select>

        , call
        <Select variant="standard"
                style={{ margin: "0 8px" }}
                value={ methodName ?? '' }
                onChange={ (e) => onMethodChange(component, e.target.value, buildDummyParams(component, e.target.value)) }
        >
          {
            component?.definition.methods.map(method => {
              return (
                <MenuItem key={ method.codeName } value={ method.codeName }>
                  <span style={{ textTransform: "uppercase", color: "blue" }}>
                    { method.name }
                  </span>
                </MenuItem>
              );
            }) ?? null
          }
        </Select>
      </span>
      {
        component && methodName ? (
          <Tooltip title={
            component.definition.methods.find(m => m.codeName === methodName).description
          }>
        <span style={{ fontSize: "10pt", color: "lightslategray" }}>
          (?)
        </span>
          </Tooltip>
        ) : null
      }
      <Box>
        {
          component && methodName && component.definition.methods.find(m => m.codeName === methodName).parameters.length > 0 ?
            <div>Where:</div> : null
        }
        {
          component && methodName ?
            component.definition.methods.find(m => m.codeName === methodName).parameters.map(param => {
              return (
                <StepParameterEditor param={ param }
                                     stepParam={ params.find(p => p.paramName === param.codeName) }
                                     subsystem={ subsystem }
                                     previousSteps={ previousSteps }
                                     onParamChange={ (newParam) => {
                                       console.log('Setting new params for step to', newParam);
                                       const existingParamIndex = params.indexOf(params.find(p => p.paramName === newParam.paramName));

                                       let newParams: StepParam[];
                                       if (existingParamIndex === -1) {
                                         // No existing parameter for this input, stick it on the end
                                         newParams = params.concat(newParam);
                                       } else {
                                         // Replace the existing param with the new one.  Not using splice so we don't modify the existing step
                                         newParams = params.slice(0, existingParamIndex).concat(newParam).concat(...params.slice(existingParamIndex + 1, params.length));
                                       }
                                       onMethodChange(component, methodName, [...newParams]);
                                     } }
                />
              );
            }) : null
        }
      </Box>
    </Box>
  );
}

function StepParameterEditor({
                               param,
                               stepParam,
                               subsystem,
                               previousSteps,
                               onParamChange
                             }: { param: ParameterDefinition, stepParam: StepParam, subsystem: Subsystem, previousSteps: SubsystemActionStep[], onParamChange: (newParam: StepParam) => void }) {
  const toSelectionValue = (argType: string, others: any): StepArgument => {
    switch (argType) {
      case "hardcode":
        return {
          type: "hardcode",
          hardcodedValue: others.hardcodedValue
        };
      case "define-passthrough-value":
        return {
          type: "define-passthrough-value",
          passthroughArgumentName: others.passthroughArgumentName
        }
      case "reference-passthrough-value":
        return {
          type: "reference-passthrough-value",
          step: others.step,
          paramName: others.paramName
        };
      case "reference-step-output":
        return {
          type: "reference-step-output",
          step: others.step
        }
      default:
        console.warn('Unsupported arg type!', argType);
        return null;
    }
  }

  return (
    <div>
        <span>
          <span>
            <span style={ { textTransform: "uppercase", color: "orangered" } }>{ param.name }</span>
            &nbsp;is...
          </span>
          <Select variant={ "standard" }
                  value={ JSON.stringify(stepParam.arg) }
                  style={ { margin: "0 8px" } }
                  onChange={ (e) => {
                    if (!e.target.value || e.target.value === '') return;

                    const data = JSON.parse(e.target.value);
                    const newParam: StepParam = {
                      paramName: param.codeName,
                      arg: {
                        // @ts-ignore
                        type: data.type as string
                      }
                    }
                    const arg = newParam.arg;
                    if (arg.type === "hardcode") {
                      arg.type = "hardcode";
                      arg.hardcodedValue = "";
                    } else if (arg.type === "define-passthrough-value") {
                      arg.passthroughArgumentName = param.name;
                    } else if (arg.type === "reference-passthrough-value") {
                      arg.step = data.step;
                      arg.paramName = data.paramName;
                    } else if (arg.type === "reference-step-output") {
                      arg.step = data.step;
                    }
                    console.debug('Created new param', newParam);
                    onParamChange(newParam);
                  } }
          >
            <MenuItem
              value={ JSON.stringify(toSelectionValue("define-passthrough-value", { passthroughArgumentName: param.name })) }>
              {/* TODO: Allow the parameter name to be specified */ }
              Set when action is called
            </MenuItem>

            <Divider/>

            {
              previousSteps.flatMap(s => s.params.filter(p => p.arg.type === "define-passthrough-value")).map(previousParam => {
                return (
                  <MenuItem key={ JSON.stringify(previousParam) }
                            value={ JSON.stringify(toSelectionValue("reference-passthrough-value", {
                              step: previousSteps.find(s => s.params.includes(previousParam)).uuid,
                              paramName: previousParam.paramName
                            })) }
                  >
                    Reuse&nbsp;<span>{ previousParam.paramName }</span>
                  </MenuItem>
                )
              })
            }

            <Divider/>

            {
              previousSteps.filter(s => {
                const previousStepMethod = subsystem.components.find(c => c.uuid === s.component).definition.methods.find(m => m.codeName === s.methodName);
                if (!previousStepMethod) return false;

                return previousStepMethod.returns === param.type; // NOTE: assumes no param will ever be defined with type `void`
              }).map((s, index) => {
                const component = subsystem.components.find(c => c.uuid === s.component);
                return (
                  <MenuItem key={ `select-output-${ s.uuid }` }
                            value={ JSON.stringify(toSelectionValue("reference-step-output", { step: s.uuid })) }>
                    The result of&nbsp;
                    <span style={{ textTransform: "uppercase", color: "blue" }}>{ component.definition.methods.find(m => m.codeName === s.methodName)?.name ?? '[UNDEFINED METHOD]' }</span>&nbsp;
                    on&nbsp;
                    <span style={{ textTransform: "uppercase", color: "blue" }}>{ component.name }</span>&nbsp;
                    <span>in step { index + 1 }</span>&nbsp;
                  </MenuItem>
                );
              })
            }
            <Divider/>
            <MenuItem value={ JSON.stringify({
              type: "hardcode",
              hardcodedValue: stepParam?.arg['hardcodedValue'] ?? 'SET ME'
            }) }>
              Hardcoded
            </MenuItem>
          </Select>
          {
            stepParam?.arg.type === "hardcode" ?
              <span>
                to&nbsp;
                <TextField defaultValue={ stepParam.arg.hardcodedValue }
                           variant={"standard"}
                           onChange={ (e) => {
                             const { paramName } = stepParam;
                             onParamChange({
                               paramName: paramName,
                               arg: {
                                 type: "hardcode",
                                 hardcodedValue: e.target.value
                               }
                             })
                } } />
              </span>
              : null
          }
        </span>
    </div>
  );
}

type ActionParams = {
  name: string;
  steps: SubsystemActionStep[];
}

type CreateActionDialogProps = {
  open: boolean;
  subsystem: Subsystem;
  editedAction: SubsystemAction | null;
  onCancel: () => void;
  onCreate: (data: ActionParams) => void;
  onUpdate: (data: ActionParams) => void;
};

function CreateActionDialog({
                              open,
                              subsystem,
                              editedAction,
                              onCancel,
                              onCreate,
                              onUpdate
                            }: CreateActionDialogProps) {
  const [actionName, setActionName] = useState(editedAction?.name ?? null);
  const [steps, setSteps] = useState(editedAction?.steps.map(s => s.clone()) ?? []);

  useEffect(() => {
    console.log("Clearing new action name and params");
    setActionName(editedAction?.name ?? null);
    setSteps(editedAction?.steps.map(s => s.clone()) ?? []);
  }, [open, editedAction]);

  return (
    <Dialog open={ open }>
      <DialogTitle>{ editedAction ? 'Edit' : 'Create' } Action</DialogTitle>
      <DialogContent>
        <Box style={ { display: "flex", flexDirection: "column", gap: "12px" } }>
          <TextField variant="standard"
                     value={ actionName }
                     onChange={ (e) => setActionName(e.target.value) }/>
          <Box style={ { display: "flex", flexDirection: "column", gap: "22px" } }>
            {
              steps.map((step, index) => {
                console.debug('[CREATE-ACTION-DIALOG] Rendering editor for step', index + 1, step);
                return <StepEditor subsystem={ subsystem }
                                   component={ subsystem.components.find(c => c.uuid === step.component) }
                                   methodName={ step.methodName }
                                   previousSteps={ steps.slice(0, index) }
                                   onMethodChange={ (component, methodName, params) => {
                                     console.debug('[CREATE-ACTION-DIALOG] Updating step', step, 'to match component:', component, 'method:', methodName, 'with params: ', params);
                                     step.component = component.uuid;
                                     step.methodName = methodName;
                                     step.params = params;
                                     setSteps([...steps]); // rerender
                                   } }
                                   params={ step.params }/>
              })
            }
          </Box>
          <Button onClick={ () => {
            const newStep = new SubsystemActionStep({});
            setSteps(steps.concat(newStep));
          } }>
            + Add Step
          </Button>
        </Box>
        <SyntaxHighlighter language="java" style={ SyntaxHighlightStyles.vs }>
          { (() => {
            const dummyAction = new SubsystemAction(actionName, subsystem.uuid);
            dummyAction.steps = [...steps];
            // dummyAction.regenerateParams(subsystem); // not needed, since params are only referenced when using the action in a command
            return generateAction_future(dummyAction, subsystem);
          })() }
        </SyntaxHighlighter>
      </DialogContent>
      <DialogActions>
        <Button onClick={ onCancel }>
          Cancel
        </Button>
        <Button onClick={ () => {
          const data = { name: actionName, steps: steps };
          !!editedAction ? onUpdate(data) : onCreate(data);
        } }
                disabled={ !actionName || !!steps.find(s => !s.methodName || !s.component || s.params.find(p => !p.arg.type)) }>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ActionsLane({
                       subsystem,
                       actions,
                       onChange
                     }: { subsystem: Subsystem, actions: SubsystemAction[], onChange: (newActions: SubsystemAction[]) => void }) {
  const [editedAction, setEditedAction] = useState(null as SubsystemAction)
  const [showCreateActionDialog, setShowCreateActionDialog] = useState(false);
  const closeDialog = () => {
    setShowCreateActionDialog(false);
    setEditedAction(null);
  }

  useEffect(() => closeDialog(), [subsystem]);

  const createAction = (data: ActionParams) => {
    console.log(data);
    const newAction = subsystem.createAction(data.name);
    newAction.steps = [...data.steps];
    newAction.regenerateParams(subsystem);

    console.debug('Created new action', newAction);
    onChange([...subsystem.actions]);
    closeDialog();
  }

  return (
    <Box className="subsystem-lane actions-lane">
      <h3>Actions</h3>
      <Box className="subsystem-lane-items">
        <CreateActionDialog open={ showCreateActionDialog }
                            subsystem={ subsystem }
                            editedAction={ editedAction }
                            onCancel={ closeDialog }
                            onCreate={ (data) => createAction(data) }
                            onUpdate={ ({ name, steps }) => {
                              editedAction.name = name;
                              editedAction.steps = [...steps];
                              editedAction.regenerateParams(subsystem);
                              onChange([...subsystem.actions]);
                              closeDialog();
                            } }/>
        {
          actions.map(action => {
            return (
              <Card key={ action.uuid } className="subsystem-lane-item" component={ Paper }>
                { action.name }
                <Button onClick={ (e) => {
                  setEditedAction(action);
                  setShowCreateActionDialog(true);
                } }>
                  Edit
                </Button>
              </Card>
            )
          })
        }
        <Button onClick={ () => {
          setEditedAction(null);
          setShowCreateActionDialog(true);
        } }>
          + Add Action
        </Button>
      </Box>
    </Box>
  );
}

function StatesLane({
                      subsystem,
                      states,
                      onChange
                    }: { subsystem: Subsystem, states: SubsystemState[], onChange: (newStates: SubsystemState[]) => void }) {
  const [showCreateStateDialog, setShowCreateStateDialog] = useState(false);
  const [newStateName, setNewStateName] = useState(null);

  const createState = (data) => {
    console.log(data);
    const newState = subsystem.createState(data.name);
    onChange([...subsystem.states]);
    console.debug('Created new state', newState);
    setNewStateName(null);
    setShowCreateStateDialog(false);
  }

  return (
    <Box className="subsystem-lane states-lane">
      <h3>States</h3>
      <Dialog open={ showCreateStateDialog }>
        <DialogTitle>Create State</DialogTitle>
        <DialogContent>
          <TextField label="Name" variant="standard" onChange={ (e) => setNewStateName(e.target.value) }/>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => setShowCreateStateDialog(false) }>Cancel</Button>
          <Button onClick={ () => createState({ name: newStateName }) } disabled={ !newStateName }>OK</Button>
        </DialogActions>
      </Dialog>
      <Box className="subsystem-lane-items">
        {
          states.map(state => {
            return (
              <Card key={ state.uuid } className="subsystem-lane-item" component={ Paper }>
                { state.name }
              </Card>
            )
          })
        }
        <Button onClick={ () => setShowCreateStateDialog(true) }>
          + Add State
        </Button>
      </Box>
    </Box>
  );
}

function CommandsLane({
                        subsystem,
                        commands,
                        onChange
                      }: { subsystem: Subsystem, commands: AtomicCommand[], onChange: (newCommands: AtomicCommand[]) => void }) {
  const [showCreateCommandDialog, setShowCreateCommandDialog] = useState(false);
  const [commandDialogType, setCommandDialogType] = useState(null);
  const [editedCommand, setEditedCommand] = useState(null as AtomicCommand);
  const [canAddCommand, setCanAddCommand] = useState(subsystem.actions.length > 0);

  useEffect(() => setCanAddCommand(subsystem.actions.length > 0), [subsystem.actions]);

  const createCommand = (data: NewCommandData) => {
    console.log(data);
    if (editedCommand) {
      editedCommand.name = data.name;
      editedCommand.toInitialize = [...data.initializeActions];
      editedCommand.action = data.action;
      editedCommand.endCondition = data.endCondition;
      editedCommand.params = data.params;
      onChange([...commands]);
    } else {
      const newCommand = data.toCommand();
      onChange(commands.concat(newCommand));
    }
    setEditedCommand(null);
    setCommandDialogType(null);
    setShowCreateCommandDialog(false);
  }

  return (
    <Box className="subsystem-lane commands-lane">
      <h3>Commands</h3>
      <CreateCommandDialog subsystem={ subsystem }
                           onCancel={ () => setShowCreateCommandDialog(false) }
                           onAccept={ createCommand }
                           defaultOpen={ showCreateCommandDialog }
                           editedCommand={ editedCommand }
                           type={ commandDialogType }/>
      <Box className="subsystem-lane-items">
        {
          subsystem.commands.map(command => {
            return (
              <Card key={ command.uuid } className="subsystem-lane-item" component={ Paper }>
                { command.name }
                <Button onClick={ () => {
                  setCommandDialogType("edit");
                  setEditedCommand(command);
                  setShowCreateCommandDialog(true);
                } }>
                  Edit
                </Button>
              </Card>
            )
          })
        }
        <Button onClick={ () => {
          setCommandDialogType("create");
          setEditedCommand(null);
          setShowCreateCommandDialog(true);
        } } disabled={ !canAddCommand && false }>
          + Add Command
        </Button>
      </Box>
    </Box>
  );
}

class NewCommandData {
  readonly name: string;
  readonly subsystem: string; // UUID
  readonly initializeActions: string[]; // UUIDs
  readonly action: string; // UUID
  readonly endCondition: EndCondition;
  readonly params: ActionParamCallOption[];

  constructor(name, subsystem, initializeActions, action, endCondition, params) {
    this.name = name;
    this.subsystem = subsystem;
    this.initializeActions = initializeActions;
    this.action = action;
    this.endCondition = endCondition;
    this.params = params;
  }

  toCommand(): AtomicCommand {
    const command = new AtomicCommand();
    command.name = this.name;
    command.subsystem = this.subsystem;
    command.toInitialize = [...this.initializeActions];
    command.action = this.action;
    command.endCondition = this.endCondition;
    command.params = [...this.params];
    return command;
  }
}

function ActionInvocationEditor(param: Param, action: SubsystemAction, params: ActionParamCallOption[], setParams: (params: ActionParamCallOption[]) => void) {
  let hardCodedValue = null;
  const existingInvocation: ActionParamCallOption | undefined = params.find(p => p.param === param.uuid);
  console.debug('Rendering controls for existing argument invocation:', existingInvocation);

  return (
    [
      <label>{ param.name }</label>,
      <span>
          <Select defaultValue={ existingInvocation?.invocationType ?? "" }
                  value={ existingInvocation?.invocationType ?? "" }
                  variant="standard"
                  onChange={ (e) => {
                    const optType = e.target.value as "hardcode" | "passthrough-value" | "passthrough-supplier";

                    const newInvocation: ActionParamCallOption = new ActionParamCallOption(action, param, optType, hardCodedValue);
                    const existingIndex = params.findIndex((option) => option.param === param.uuid);
                    let newParams: ActionParamCallOption[];
                    if (existingIndex >= 0) {
                      // replace
                      params.splice(existingIndex, 1, newInvocation);
                      newParams = [...params];
                    } else {
                      // concat
                      newParams = params.concat(newInvocation);
                    }
                    // sort to keep the parameters in the same order they appear in the action param defs
                    newParams = newParams.sort((a, b) => action.params.findIndex(p => p.uuid === a.param) - action.params.findIndex(p => p.uuid === b.param));
                    setParams(newParams);
                  } }>
            <MenuItem value={ "hardcode" }>
              Hardcoded
            </MenuItem>
            <MenuItem value={ "passthrough-value" }>
              Pass through a value
            </MenuItem>
            <MenuItem value={ "passthrough-supplier" }>
              Pass through with a supplier
            </MenuItem>
          </Select>
          <TextField variant="standard"
                     defaultValue={ existingInvocation?.hardcodedValue ?? "" }
                     value={ existingInvocation?.hardcodedValue ?? "" }
                     onChange={ (e) => {
                       hardCodedValue = e.target.value;
                       const newParam = new ActionParamCallOption(action, param, "hardcode", hardCodedValue);
                       const existingParam = params.find(p => p.param === param.uuid);

                       console.debug('Replacing existing param', existingParam, 'with new param', newParam);

                       params.splice(params.indexOf(existingParam), 1, newParam);
                       setParams([...params]);
                     } }/>
        </span>
    ]
  );
}


function CreateCommandDialog({
                               subsystem,
                               onCancel,
                               onAccept,
                               defaultOpen,
                               type,
                               editedCommand
                             }: { subsystem: Subsystem, onCancel: () => void, onAccept: (string) => void, defaultOpen: boolean, type: "create" | "edit", editedCommand: AtomicCommand | null }) {
  const [initializeActions, setInitializeActions] = useState(editedCommand?.toInitialize ?? []);
  const [selectedAction, setSelectedAction] = useState(editedCommand?.action);
  const [endCondition, setEndCondition] = useState(editedCommand?.endCondition);
  const [commandName, setCommandName] = useState(editedCommand?.name);
  const [params, setParams] = useState(editedCommand?.params ?? []);

  // doesn't clear properly when hitting +add command, closing, then re-opening
  useEffect(() => setInitializeActions(editedCommand?.toInitialize ?? []), [editedCommand, subsystem, defaultOpen]);
  useEffect(() => setSelectedAction(editedCommand?.action), [editedCommand, subsystem, defaultOpen]);
  useEffect(() => setEndCondition(editedCommand?.endCondition), [editedCommand, subsystem, defaultOpen]);
  useEffect(() => setCommandName(editedCommand?.name), [editedCommand, subsystem, defaultOpen]);
  useEffect(() => setParams(editedCommand?.action === selectedAction ? editedCommand?.params ?? [] : []), [editedCommand, subsystem, defaultOpen, selectedAction]);

  return (
    <Dialog open={ defaultOpen } className="create-command-dialog">
      <DialogTitle>{ type === "create" ? "Create Command" : "Edit Command" }</DialogTitle>
      <DialogContent className="content">
        <span className="subsystem-heading">
          Using the
          <span className="subsystem-name">
            { subsystem.name }
          </span>
          subsystem,
        </span>

        <span className="initialize-heading">
          {/* TODO: Support more than one action */ }
          Initialize with the
          <Select className="action-select"
                  variant="standard"
                  defaultValue={ editedCommand?.toInitialize.join(",") ?? "" }
                  onChange={ (e) => {
                    const selectedActionUUID = e.target.value;
                    if (selectedActionUUID && selectedActionUUID.length > 0) {
                      setInitializeActions([selectedActionUUID]);
                    } else {
                      setInitializeActions([]);
                    }
                  } }
          >
            {
              subsystem.actions.map(action => {
                return (
                  <MenuItem value={ action.uuid }
                            key={ action.uuid }>
                    <span className="subsystem-action-name">{ action.name }</span>
                  </MenuItem>
                )
              })
            }
            <Divider/>
            <MenuItem value={ "" } key={ 'none' }>
              None
            </MenuItem>
          </Select>
          action
          {
            subsystem.actions.find(action => action.uuid === initializeActions[0]) ?
              (
                <Box className="params-configuration"
                     style={ { display: "grid", gridTemplateColumns: "150px minmax(200px, 1fr)" } }>
                  {
                    subsystem
                      .actions.find(action => action.uuid === initializeActions[0]).params
                      .map(p => ActionInvocationEditor(p, subsystem.actions.find(a => a.uuid === initializeActions[0]), [...params], setParams))
                  }
                </Box>
              ) :
              null }
        </span>

        <span className="action-heading">
          Run the
          <Select className="action-select"
                  variant="standard"
                  defaultValue={ editedCommand?.action }
                  onChange={ (e) => {
                    const selectedActionUUID = e.target.value;
                    setSelectedAction(selectedActionUUID);
                  } }
                  placeholder={ "Select an action..." }>
            {
              subsystem.actions.map(action => {
                return (
                  <MenuItem value={ action.uuid }
                            key={ action.uuid }>
                    <span className="subsystem-action-name">{ action.name }</span>
                  </MenuItem>
                )
              })
            }
          </Select>
          action
        </span>

        <span className="state-heading">
          Until...
          <Select className="state-select"
                  variant="standard"
                  onChange={ (e) => {
                    console.debug('Setting end condition to', e.target.value);
                    setEndCondition(e.target.value);
                  } }
                  defaultValue={ editedCommand?.endCondition }>
            <MenuItem value="forever">
              It is interrupted or canceled
            </MenuItem>
            <MenuItem value="once">
              It has run exactly once
            </MenuItem>
            {
              subsystem.states.map(state => {
                return (
                  <MenuItem value={ state.uuid }
                            key={ state.uuid }>
                    The
                    <span className="subsystem-name">{ subsystem.name }</span> reaches <span
                    className="subsystem-state-name">{ state.name }</span>
                  </MenuItem>
                );
              })
            }
          </Select>
        </span>
        <span className="command-name">
          And call it <TextField defaultValue={ editedCommand?.name }
                                 variant="standard"
                                 onChange={ (e) => setCommandName(e.target.value) }/>
        </span>

        {
          subsystem.actions.find(action => action.uuid === selectedAction) ?
            (
              <Box className="params-configuration"
                   style={ { display: "grid", gridTemplateColumns: "150px minmax(200px, 1fr)" } }>
                {
                  subsystem
                    .actions.find(action => action.uuid === selectedAction).params
                    .map(p => ActionInvocationEditor(p, subsystem.actions.find(a => a.uuid === selectedAction), [...params], setParams))
                }
              </Box>
            ) :
            null
        }
        <div className="code-preview java-code-preview">
          <SyntaxHighlighter language="java" style={ SyntaxHighlightStyles.vs }>
            {
              (() => {
                try {
                  return generateCommand(commandName, subsystem, selectedAction, endCondition, params, initializeActions, [], []);
                } catch (e) {
                  console.error(e);
                  return `ERROR: Failed to generate code for command ${ commandName }: ${ e }`;
                }
              })()
            }
          </SyntaxHighlighter>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={ () => {
          onCancel();
        } }>Cancel</Button>
        <Button
          onClick={ () => {
            onAccept(new NewCommandData(commandName, subsystem.uuid, initializeActions, selectedAction, endCondition, params));
          } }
          disabled={ (() => {
            // console.debug('Checking if the', type, 'command dialog should be submittable');
            // console.debug('  selectedAction:', selectedAction);
            // console.debug('  endCondition:', endCondition);
            // console.debug('  commandName:', commandName);

            return !selectedAction || !endCondition || !commandName;
          })() }>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RenameSubsystemDialog({
                                 subsystem,
                                 onCancel,
                                 onAccept,
                                 defaultOpen
                               }: { subsystem: Subsystem, onCancel: () => void, onAccept: (string) => void, defaultOpen: boolean }) {

  // const [name, setName] = useState(subsystem?.name);
  let name = subsystem?.name;

  if (!subsystem) {
    console.warn('No subsystem given?');
    return null;
  }

  const handleCancel = () => {
    name = (subsystem.name);
    onCancel();
  }

  const handleAccept = () => {
    onAccept(name);
  }

  return (
    <Dialog open={ defaultOpen }>
      <DialogTitle>Rename { subsystem.name }</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Rename { subsystem.name }
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
          variant="standard"
          defaultValue={ name }
          onChange={ (e) => name = (e.target.value) }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={ handleCancel }>Cancel</Button>
        <Button onClick={ handleAccept }>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

const CAN_TALON_FX: ComponentDefinition = {
  id: "SAMPLE-cantalonfx",
  name: "CAN Talon FX",
  fqn: "com.ctre.phoenix.motorcontrol.can.WPI_TalonFX",
  className: "WPI_TalonFX",
  type: "actuator",
  wpilibApiTypes: ["MotorController"],
  hints: ["action", "motor"],
  methods: [
    {
      name: "Set Speed",
      description: "Sets the speed of the motor as a value from -1 for full reverse to +1 for full forward speed. The actual speed of the motor will depend on the torque load and the voltage supplied by the battery.",
      codeName: "set",
      hints: ["action", "motor-input"],
      parameters: [
        { name: "Speed", description: "", codeName: "speed", type: "double" }
      ],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "CAN ID",
      description: "The ID of the Talon FX on the CAN bus.  This value is set by the Phoenix Tuner tool, and must be unique among ALL Talon FX devices on the bus.",
      codeName: "deviceNumber",
      type: "int",
      setInConstructor: true,
      getter: {
        name: "Get Device ID",
        description: "Gets the configured CAN ID for the Talon FX",
        codeName: "getDeviceID",
        hints: [],
        parameters: [],
        returns: "int"
      }
    }
  ]
};
const MOTOR_CONTROLLER_GROUP: ComponentDefinition = {
  id: "SAMPLE-motorcontrollergroup",
  name: "Motor Controller Group",
  fqn: "edu.wpi.first.wpilibj.MotorControllerGroup",
  className: "MotorControllerGroup",
  type: "actuator",
  wpilibApiTypes: ["MotorController"],
  hints: ["action"],
  methods: [
    {
      name: "Set Speed",
      description: "Sets the speed of the motor as a value from -1 for full reverse to +1 for full forward speed. The actual speed of the motor will depend on the torque load and the voltage supplied by the battery.",
      codeName: "set",
      hints: ["action", "motor-input"],
      parameters: [
        { name: "Speed", description: "", codeName: "speed", type: "double" }
      ],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "Motors",
      description: "The motors to group together",
      codeName: "motors",
      type: "vararg MotorController",
      setInConstructor: true
    }
  ]
}

const BASIC_GYRO: ComponentDefinition = {
  id: "SAMPLE-analoggyro",
  name: "Analog Gyroscope",
  fqn: "edu.wpi.first.wpilib.AnalogGyro",
  className: "AnalogGyro",
  wpilibApiTypes: ["Gyro"],
  type: "sensor",
  hints: ["state"],
  methods: [
    {
      name: "Get Heading",
      description: "Gets the current angle of the gyro, where 0 is the angle it was at when last reset",
      codeName: "getAngle",
      returns: "double",
      parameters: [],
      hints: ["controller-setpoint"]
    }
  ],
  properties: [
    {
      name: "Analog Port",
      description: "The analog port the gyro is plugged into on the RoboRIO",
      codeName: "channel",
      type: "int",
      setInConstructor: true
    }
  ]
};

const PID_CONTROLLER: ComponentDefinition = {
  id: "SAMPLE-pidcontroller",
  name: "PID Controller",
  fqn: "edu.wpi.first.math.controller.PIDController",
  className: "PIDController",
  wpilibApiTypes: [],
  type: "control",
  hints: ["action"],
  methods: [
    {
      name: "Calculate",
      description: "Calculates the output of the controller based on the current state of the system.  Requires the setpoint to have been set first.",
      codeName: "calculate",
      hints: ["action", "motor-input"],
      parameters: [
        {
          name: "Current Position",
          description: "The current position of the system",
          codeName: "measurement",
          type: "double",
          tags: []
        }
      ],
      returns: "double"
    },
    {
      name: "Set Setpoint",
      description: "Configures the target setpoint for the controller to reach.  Use Calculate in an action to periodically update the output to get closer to the setpoint",
      codeName: "setSetpoint",
      hints: ["housekeeping"],
      beforeCalling: "reset",
      parameters: [
        {
          name: "Setpoint",
          description: "The setpoint to target",
          codeName: "setpoint",
          type: "double",
          tags: ["controller-setpoint"]
        }
      ],
      returns: "void"
    },
    {
      name: "Reset",
      description: "Resets the controller and its internal state.  Use this when changing the setpoint, or if the calculate method may not have been called in a while",
      codeName: "reset",
      hints: ["housekeeping"],
      parameters: [],
      returns: "void"
    },
    {
      name: "Reached Setpoint",
      description: "Checks if the controller has reached the setpoint",
      codeName: "atSetpoint",
      hints: ["state"],
      parameters: [],
      returns: "boolean"
    }
  ],
  properties: [
    {
      name: "Proportional Constant",
      description: "The constant value for the controller to use to determine a motor speed based on how far away the system is from the setpoint",
      codeName: "kp",
      type: "double",
      setInConstructor: true,
      setter: {
        name: "Set Proportional Constant",
        description: "",
        codeName: "setP",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Proportional Constant",
            description: "",
            codeName: "kp",
            type: "double",
            tags: []
          }
        ]
      }
    },
    {
      name: "Integral Constant",
      description: "The constant value for the controller to use to determine a motor speed based on how long it's been off target.  Useful if the proportional constant get close to the setpoint, but not exactly.  Typically isn't used.",
      codeName: "ki",
      type: "double",
      setInConstructor: true,
      setter: {
        name: "Set Integral Constant",
        description: "",
        codeName: "setI",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Integral Constant",
            description: "",
            codeName: "ki",
            type: "double",
            tags: []
          }
        ]
      }
    },
    {
      name: "Derivative Constant",
      description: "The constant value for the controller to use to slow motor speed based on how fast it's approaching the setpoint.  Useful to avoid overshoot and oscillations.",
      codeName: "kd",
      type: "double",
      setInConstructor: true,
      setter: {
        name: "Set Proportional Constant",
        description: "",
        codeName: "setD",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Derivative Constant",
            description: "",
            codeName: "kd",
            type: "double",
            tags: []
          }
        ]
      }
    },
    {
      name: "Tolerance",
      description: "Sets the tolerance of the controller.  Increasing values mean `Reached Setpoint` will be true when the system is farther away from the target setpoint",
      codeName: "tolerance",
      type: "double",
      setInConstructor: false,
      setter: {
        name: "Set Tolerance",
        description: "",
        codeName: "setTolerance",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Tolerance",
            description: "",
            codeName: "tolerance",
            type: "double",
            tags: []
          }
        ]
      }
    }
  ]
}

const DIFFERENTIAL_DRIVE: ComponentDefinition = {
  id: "SAMPLE-differentialdrive",
  name: "Differential Drive",
  fqn: "edu.wpi.first.wpilibj.drive.DifferentialDrive",
  className: "DifferentialDrive",
  wpilibApiTypes: [],
  type: "actuator",
  hints: ["action"],
  methods: [
    {
      name: "Arcade Drive",
      description: "Drives the motors with a single joystick like an arcade game.  Traditionally, moving the joystick forward and back drives straight in those directions, while moving left or right makes the robot turn in place or drive in an arc.  Note that, because most joysticks don't output in a [-1, 1] on both axes simultaneously, the maximum speed is typically lower than tank drive when driving in an arc",
      codeName: "arcadeDrive",
      hints: ["action", "joystick-input"],
      parameters: [
        {
          name: "Forward Speed",
          description: "The speed to apply to straight-line movement.  This is combined with the Turning Speed input to calculate the power needed to output to the left and right side motors.",
          codeName: "xSpeed",
          type: "double"
        },
        {
          name: "Turning Speed",
          description: "The speed to apply to turning.  This is combined with the Forward Speed input to calculate the power needed to output to the left and right side motors.",
          codeName: "zRotation",
          type: "double"
        },
        {
          name: "Squared Inputs",
          description: "Squares the input values to make the response act quadratically rather than linearly for improved control at lower speeds.  Maximum speeds are unaffected.",
          codeName: "squareInputs",
          type: "boolean",
          optional: true
        }
      ],
      returns: "void"
    },
    {
      name: "Tank Drive",
      description: "Drives the motors like a tank, where the driver uses independent joysticks to control the treads on the left and right side independently.",
      codeName: "tankDrive",
      hints: ["action", "joystick-input"],
      parameters: [
        {
          name: "Left Speed",
          description: "The speed to drive the left-side motors at. Ranges from -1 for full speed in reverse to +1 for full speed forward.  Values outside that range will be clamped to be in [-1, 1].",
          codeName: "leftSpeed",
          type: "double"
        },
        {
          name: "Right Speed",
          description: "The speed to drive the right-side motors at.  Ranges from -1 for full speed in reverse to +1 for full speed forward.  Values outside that range will be clamped to be in [-1, 1].",
          codeName: "rightSpeed",
          type: "double"
        },
        {
          name: "Squared Inputs",
          description: "Squares the input values to make the response act quadratically rather than linearly for improved control at lower speeds.  Maximum speeds are unaffected.",
          codeName: "squareInputs",
          type: "boolean",
          optional: true
        }
      ],
      returns: "void"
    },
    {
      name: "Stop",
      codeName: "stopMotor",
      description: "Immediately stops all motors by setting their speeds to zero.",
      hints: ["action"],
      parameters: [],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "Left Motor",
      description: "The motor that powers the left-side wheels",
      codeName: "leftMotor",
      type: "MotorController",
      setInConstructor: true
    },
    {
      name: "Right Motor",
      description: "The motor that powers the right-side wheels",
      codeName: "rightMotor",
      type: "MotorController",
      setInConstructor: true
    },
    {
      name: "Deadband",
      description: "The lower limit on inputs to motor speeds.  Any input speed less than this value will be set to zero instead and the motor will not move.",
      codeName: "deadband",
      type: "double",
      setInConstructor: false,
      setter: {
        name: "Set Deadband",
        description: "Sets the deadband of the drive.  Any motor inputs less than this value will be set to zero instead.",
        codeName: "setDeadband",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Deadband",
            description: "",
            codeName: "deadband",
            type: "double"
          }
        ]
      }
    },
    {
      name: "Maximum Output",
      description: "The maximum motor output.  This is used to scale the output values calculated by the controller. For example, set to 0.5 to make a motor set to a speed of 1.0 turn at only half speed.",
      codeName: "maxOutput",
      type: "double",
      setInConstructor: false,
      setter: {
        name: "Set Maximum Output",
        description: "",
        codeName: "setMaxOutput",
        hints: [],
        returns: "void",
        parameters: [
          {
            name: "Max Output",
            description: "",
            codeName: "maxOutput",
            type: "double"
          }
        ]
      }
    }
  ]
}

COMPONENT_DEFINITIONS.addDefinition(CAN_TALON_FX);
COMPONENT_DEFINITIONS.addDefinition(MOTOR_CONTROLLER_GROUP);
COMPONENT_DEFINITIONS.addDefinition(DIFFERENTIAL_DRIVE);

COMPONENT_DEFINITIONS.addDefinition(PID_CONTROLLER);
COMPONENT_DEFINITIONS.addDefinition(BASIC_GYRO);

function drivebaseTemplate() {
  const drivebase = new Subsystem();
  drivebase.name = "Drive Base";

  const frontLeftMotor = new SubsystemComponent("Front Left Motor", CAN_TALON_FX, { deviceNumber: 1 });
  const backLeftMotor = new SubsystemComponent("Back Left Motor", CAN_TALON_FX, { deviceNumber: 2 });
  const frontRightMotor = new SubsystemComponent("Front Right Motor", CAN_TALON_FX, { deviceNumber: 3 });
  const backRightMotor = new SubsystemComponent("Back Right Motor", CAN_TALON_FX, { deviceNumber: 4 });
  const leftMotorGroup = new SubsystemComponent("Left Motors", MOTOR_CONTROLLER_GROUP, { motors: [frontLeftMotor.uuid, backLeftMotor.uuid] });
  const rightMotorGroup = new SubsystemComponent("Right Motors", MOTOR_CONTROLLER_GROUP, { motors: [frontRightMotor.uuid, backRightMotor.uuid] });
  const differentialDrive = new SubsystemComponent("Differential Drive", DIFFERENTIAL_DRIVE, {
    leftMotor: leftMotorGroup.uuid,
    rightMotor: rightMotorGroup.uuid
  });

  const gyro = new SubsystemComponent("Gyro", BASIC_GYRO, { channel: 1 });
  const turningPIDController = new SubsystemComponent("Turning PID Controller", PID_CONTROLLER, {
    kp: "10",
    ki: "0.5",
    kd: "1",
    tolerance: "1"
  })

  drivebase.components = [
    gyro,
    frontLeftMotor,
    backLeftMotor,
    frontRightMotor,
    backRightMotor,
    leftMotorGroup,
    rightMotorGroup,
    differentialDrive,
    turningPIDController
  ];

  const stopAction = drivebase.createAction("Stop");
  stopAction.steps = [
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "stopMotor",
      params: [],
      uuid: "example-differential-drive-stop-motor"
    })
  ];

  const tankDriveAction = drivebase.createAction("Tank Drive");
  tankDriveAction.params = [
    Param.create("Left Speed", "double"),
    Param.create("Right Speed", "double"),
    Param.create("Squared Inputs", "boolean")
  ];
  tankDriveAction.steps = [
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "tankDrive",
      params: [
        {
          paramName: "leftSpeed",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Left Speed"
          }
        },
        {
          paramName: "rightSpeed",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Right Speed"
          }
        },
        {
          paramName: "squareInputs",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Squared Inputs"
          }
        }
      ],
      uuid: "example-differential-drive-tank-drive"
    })
  ];

  const arcadeDriveAction = drivebase.createAction("Arcade Drive");
  arcadeDriveAction.params = [
    Param.create("Forward Speed", "double"),
    Param.create("Turning Speed", "double"),
    Param.create("Squared Inputs", "boolean")
  ]
  arcadeDriveAction.steps = [
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "arcadeDrive",
      params: [
        {
          paramName: "xSpeed",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Forward Speed"
          }
        },
        {
          paramName: "zRotation",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Turning Speed"
          }
        },
        {
          paramName: "squareInputs",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Squared Inputs"
          }
        }
      ],
      uuid: "example-differential-drive-arcade-drive"
    })
  ];

  const turnToAngleAction = drivebase.createAction("Turn to Target Angle");
  turnToAngleAction.params = [];
  turnToAngleAction.steps = [
    new SubsystemActionStep({
      component: gyro.uuid,
      methodName: "getAngle",
      params: [],
      uuid: "example-turn-to-angle-get-angle"
    }),
    new SubsystemActionStep({
      component: turningPIDController.uuid,
      methodName: "calculate",
      params: [
        {
          paramName: "measurement",
          arg: {
            type: "reference-step-output",
            step: "example-turn-to-angle-get-angle"
          }
        }
      ],
      uuid: "example-turn-to-angle-update-pid"
    }),
    new SubsystemActionStep({
      component: differentialDrive.uuid,
      methodName: "arcadeDrive",
      params: [
        {
          paramName: "xSpeed",
          arg: {
            type: "hardcode",
            hardcodedValue: "0"
          }
        },
        {
          paramName: "zRotation",
          arg: {
            type: "reference-step-output",
            step: "example-turn-to-angle-update-pid"
          }
        },
        {
          paramName: "squareInputs",
          arg: {
            type: "hardcode",
            hardcodedValue: "false"
          }
        }
      ],
      uuid: "example-turn-to-angle-drive-motors"
    })
  ];

  const setTargetTurningAngleAction = drivebase.createAction("Set Target Turning Angle");
  setTargetTurningAngleAction.params = [
    Param.create("Target Angle", "double")
  ];
  setTargetTurningAngleAction.steps = [
    new SubsystemActionStep({
      component: turningPIDController.uuid,
      methodName: "reset",
      params: [],
      uuid: "example-set-target-turning-angle-reset-pid"
    }),
    new SubsystemActionStep({
      component: turningPIDController.uuid,
      methodName: "setSetpoint",
      params: [
        {
          paramName: "setpoint",
          arg: {
            type: "define-passthrough-value",
            passthroughArgumentName: "Target Angle"
          }
        }
      ],
      uuid: "example-set-target-turning-angle-set-pid-setpoint"
    })
  ];

  drivebase.createState("Stopped");
  const atAngleState = drivebase.createState("At Turning Angle");

  const stopCommand = drivebase.createCommand("Stop", stopAction, "once");
  const tankDriveCommand = drivebase.createCommand("Drive with Speeds", tankDriveAction, "forever");
  tankDriveCommand.params = [
    new ActionParamCallOption(tankDriveAction, tankDriveAction.params[0], "passthrough-value"),
    new ActionParamCallOption(tankDriveAction, tankDriveAction.params[1], "passthrough-value"),
    new ActionParamCallOption(tankDriveAction, tankDriveAction.params[2], "hardcode", "false")
  ];

  const arcadeDriveCommand = drivebase.createCommand("Arcade Drive with Joysticks", arcadeDriveAction, "forever");
  arcadeDriveCommand.params = [
    new ActionParamCallOption(arcadeDriveAction, arcadeDriveAction.params[0], "passthrough-supplier"),
    new ActionParamCallOption(arcadeDriveAction, arcadeDriveAction.params[1], "passthrough-supplier"),
    new ActionParamCallOption(arcadeDriveAction, arcadeDriveAction.params[2], "hardcode", "true")
  ];

  const turnToAngleCommand = drivebase.createCommand("Turn To Angle", turnToAngleAction, atAngleState.uuid);
  turnToAngleCommand.params = [
    new ActionParamCallOption(setTargetTurningAngleAction, setTargetTurningAngleAction.params[0], "passthrough-value")
  ];
  turnToAngleCommand.toInitialize = [setTargetTurningAngleAction.uuid];
  turnToAngleCommand.toComplete = [stopAction.uuid];
  turnToAngleCommand.toInterrupt = []; // we could also run the stop action here

  return drivebase;
}

function NewSubsystemsPane({ acceptNewSubsystem }: { acceptNewSubsystem: (Subsystem) => void }) {
  const newDriveBase = () => {
    const driveBase = drivebaseTemplate();
    acceptNewSubsystem(driveBase);
  };

  return (
    <Box style={ {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "40px"
    } }>
      <Button onClick={ newDriveBase }>
        <Box>
          <Tooltip
            title={ "A robot has to move around somehow!  This supports the three most common drive base types: differential drives (also called skid-steer or tank drive); swerve drives; and mecanum drives." }>
            <h3>Drive Base</h3>
          </Tooltip>
          <img src={ "logo192.png" } alt={ "" } title={ "DRIVE BASE IMAGE" }/>
        </Box>
      </Button>
      <Button onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip title={ "A rotating arm with a single pivot point" }>
            <h3>Single-Jointed Arm</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip title={ "A rotating arm with two pivot points" }>
            <h3>Double-Jointed Arm</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip
            title={ "A wrist at the end of an arm, or a low-mass pivoting mechanism that doesn't require sophisticated controls like an arm would" }>
            <h3>Wrist</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip
            title={ "A subsystem that has a linear extension and retraction. This could be vertical, in the case of a traditional elevator, or angled, or even horizontal" }
          >
            <h3>Elevator</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button onClick={ () => {
        const blankSubsystem = new Subsystem();
        blankSubsystem.name = "Blank Subsystem";
        acceptNewSubsystem(blankSubsystem);
      } }>
        <Box>
          <Tooltip title={ "A new blank subsystem with no prebuilt configuration" }>
            <h3>Blank</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
    </Box>
  );
}

export function Subsystems({ project }: { project: Project }) {
  const [currentSubsystem, setCurrentSubsystem] = useState(project.subsystems[0]);
  if (currentSubsystem && !project.subsystems.find(s => s.uuid === currentSubsystem.uuid)) {
    // Project changed and removed our subsystem.  Reset the component to display the first subsystem again.
    setCurrentSubsystem(project.subsystems[0]);
  }

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    subsystem: Subsystem;
  } | null>(null);

  const [contextMenuSubsystem, setContextMenuSubsystem] = useState(null);
  useEffect(() => setContextMenuSubsystem(project.subsystems.length === 0 || !currentSubsystem), [project, project.subsystems, currentSubsystem]);

  const handleContextMenu = (subsystem: Subsystem) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      console.log('handleContextMenu(', subsystem, ')');
      setContextMenuSubsystem(subsystem);
      setContextMenu(
        contextMenu == null ?
          { mouseX: event.clientX, mouseY: event.clientY, subsystem: subsystem } :
          null
      );
    };
  }

  const handleClose = () => {
    // setContextMenuSubsystem(null);
    setContextMenu(null);
  }

  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const renameSubsystem = (subsystem: Subsystem) => {
    console.log('RENAME', subsystem);
    setContextMenuSubsystem(subsystem);
    setShowRenameDialog(true);
    handleClose();
  }

  const deleteSubsystem = (subsystem: Subsystem) => {
    console.log('DELETE', subsystem);
    const index = project.subsystems.indexOf(subsystem);
    project.subsystems = project.subsystems.filter(s => s !== subsystem);
    if (currentSubsystem === subsystem) {
      // Deleted the selected subsystem - select the tab to the left, or, if it was the leftmost one already,
      // select the new leftmost subsystem
      const newSelectedIndex = Math.max(0, index - 1);
      setCurrentSubsystem(project.subsystems[newSelectedIndex]);
    }
    handleClose();
  }

  const [showSubsystemCreate, setShowSubsystemCreate] = useState(project.subsystems.length === 0);

  return (
    <Box className="subsystems">
      <Tabs onChange={ (_, selectedUuid) => {
        if (selectedUuid === "create-subsystem") {
          setShowSubsystemCreate(true);
          setCurrentSubsystem(null);
        } else {
          setShowSubsystemCreate(false);
          setCurrentSubsystem(project.subsystems.find(s => s.uuid === selectedUuid));
        }
      } }
            value={ currentSubsystem?.uuid ?? "create-subsystem" } centered>
        {
          project.subsystems.map(subsystem => {
            return (
              <Tab label={ subsystem.name }
                   value={ subsystem.uuid }
                   key={ subsystem.uuid }
                   onContextMenu={ handleContextMenu(subsystem) }/>
            );
          })
        }
        <Tab label={ "+ Create Subsystem" }
             value={ "create-subsystem" }
             key={ "create-subsystem-tab" }/>
      </Tabs>
      <RenameSubsystemDialog subsystem={ contextMenuSubsystem }
                             onCancel={ () => setShowRenameDialog(false) }
                             onAccept={ (name: string) => {
                               contextMenuSubsystem.name = name;
                               setCurrentSubsystem(currentSubsystem);
                               setShowRenameDialog(false);
                             } }
                             defaultOpen={ contextMenuSubsystem !== null && showRenameDialog }/>
      {
        showSubsystemCreate || !currentSubsystem ?
          <NewSubsystemsPane acceptNewSubsystem={ (subsystem) => {
            project.subsystems.push(subsystem);
            setCurrentSubsystem(subsystem);
            setShowSubsystemCreate(false);
          }
          }/> :
          <SubsystemPane subsystem={ currentSubsystem } project={ project }/>
      }

      <Menu open={ contextMenu !== null }
            onClose={ handleClose }
            anchorReference="anchorPosition"
            anchorPosition={ contextMenu !== null ? {
              left: contextMenu.mouseX,
              top: contextMenu.mouseY
            } : undefined }>
        <MenuItem onClick={ () => renameSubsystem(contextMenuSubsystem) }>
          Rename
        </MenuItem>
        <MenuItem onClick={ () => deleteSubsystem(contextMenuSubsystem) }>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
