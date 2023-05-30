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
  DialogTitle, Divider,
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
import { MethodDefinition, ParameterDefinition } from "../../components/ComponentDefinition";
import { generateCommand } from "../../codegen/java/CommandGenerator";
import { generateSubsystem } from "../../codegen/java/SubsystemGenerator";
import { ComponentLane } from "./ComponentLane";
import { generateAction_future } from "../../codegen/java/ActionGenerator";
import { generateState } from "../../codegen/java/StateGenerator";
import { differentialDrivebaseTemplate } from "../../templates/DifferentialDrivebase";


type BasicOpts = {
  subsystem: Subsystem;
  project: Project;
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
  /**
   * An optional callback to use to filter and sort components for display in the editor.
   */
  componentMapper?: (allComponents: SubsystemComponent[]) => SubsystemComponent[];
  /**
   * An optional callback to use to filter and sort methods for display in the editor.
   */
  methodMapper?: (allMethods: MethodDefinition[]) => MethodDefinition[];
  onMethodChange: (component: SubsystemComponent, methodName: string, params: StepParam[]) => void,
};

function StepEditor({
                      subsystem,
                      component,
                      methodName,
                      params,
                      previousSteps,
                      componentMapper,
                      methodMapper,
                      onMethodChange
                    }: StepEditorProps) {

  if (!componentMapper) componentMapper = (components) => components;
  if (!methodMapper) methodMapper = (methods) => methods;

  const availableComponents = componentMapper(subsystem.components).filter(c => methodMapper(c.definition.methods).length > 0);
  const availableMethods = component ? methodMapper(component.definition.methods) : [];

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
                style={ { margin: "0 8px" } }
                value={ component?.uuid ?? '' }
                onChange={ (e) => {
                  const componentUuid = e.target.value;
                  const newComponent = subsystem.components.find(c => c.uuid === componentUuid);
                  onMethodChange(newComponent, null, []);
                } }>
          {
            availableComponents.map(c => {
              return (
                <MenuItem key={ c.uuid } value={ c.uuid }>
                  <span style={ { textTransform: "uppercase", color: "blue" } }>
                    { c.name }
                  </span>
                </MenuItem>
              );
            })
          }
        </Select>

        , call
        <Select variant="standard"
                style={ { margin: "0 8px" } }
                value={ methodName ?? '' }
                onChange={ (e) => onMethodChange(component, e.target.value, buildDummyParams(component, e.target.value)) }
        >
          {
            availableMethods.map(method => {
              return (
                <MenuItem key={ method.codeName } value={ method.codeName }>
                  <span style={ { textTransform: "uppercase", color: "blue" } }>
                    { method.name }
                  </span>
                </MenuItem>
              );
            })
          }
        </Select>
      </span>
      {
        component && methodName ? (
          <Tooltip title={
            component.definition.methods.find(m => m.codeName === methodName).description
          }>
        <span style={ { fontSize: "10pt", color: "lightslategray" } }>
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
                      arg.passthroughArgumentName = param.codeName;
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
              value={ JSON.stringify(toSelectionValue("define-passthrough-value", { passthroughArgumentName: stepParam.paramName })) }>
              {/* TODO: Allow the parameter name to be specified */ }
              Provided when the action is run
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
                    <span style={ {
                      textTransform: "uppercase",
                      color: "blue"
                    } }>{ component.definition.methods.find(m => m.codeName === s.methodName)?.name ?? '[UNDEFINED METHOD]' }</span>&nbsp;
                    on&nbsp;
                    <span style={ { textTransform: "uppercase", color: "blue" } }>{ component.name }</span>&nbsp;
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
                           variant={ "standard" }
                           onChange={ (e) => {
                             const { paramName } = stepParam;
                             onParamChange({
                               paramName: paramName,
                               arg: {
                                 type: "hardcode",
                                 hardcodedValue: e.target.value
                               }
                             })
                           } }/>
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
    const pullEditedData = open && !!editedAction;
    setActionName(pullEditedData ? editedAction.name : null);
    setSteps(pullEditedData ? editedAction.steps.map(s => s.clone()) : []);
    console.debug("[CREATE-ACTION-DIALOG] Reset new action name and params to", actionName, steps);
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
                              closeDialog();
                              editedAction.name = name;
                              editedAction.steps = [...steps];
                              editedAction.regenerateParams(subsystem);

                              // Find the command that use the edited action, then remove any of their defined parameters that
                              // pass through to a no longer defined param on the action.
                              // Otherwise commands would have dangling references to nonexistent action params with no way to remove them
                              subsystem.commands.filter(c => c.callsAction(editedAction)).forEach(command => {
                                // Make sure any calling commands are updated to account for the action changes to the action
                                console.debug('[ACTION-UPDATE] Updating command', command.name, 'to account for parameters possibly going away');
                                command.params = command.params.filter(commandParamDef => {
                                  const references = commandParamDef.action === editedAction.uuid && !editedAction.params.find(ap => ap.uuid === commandParamDef.param);
                                  if (references) {
                                    // The command references a parameter that no longer exists on the action!
                                    console.debug('[ACTION-UPDATE] Parameter', commandParamDef.param, 'went away!');
                                  }
                                  return references;
                                });
                              })
                              onChange([...subsystem.actions]);
                              setEditedAction(null);
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
  const [editedState, setEditedState] = useState(null as SubsystemState);
  const [newStateName, setNewStateName] = useState(null as string);
  const [newStateComponent, setNewStateComponent] = useState(null as SubsystemComponent);
  const [newStateMethod, setNewStateMethod] = useState(null as string);
  const [newStateParams, setNewStateParams] = useState([] as StepParam[]);

  const createState = () => {
    if (editedState) {
      editedState.name = newStateName;
      editedState.step = editedState.step?.clone() ?? new SubsystemActionStep({});
      editedState.step.component = newStateComponent?.uuid;
      editedState.step.methodName = newStateMethod;
      editedState.step.params = [...newStateParams];
    } else {
      const newState = subsystem.createState(newStateName);
      newState.step = new SubsystemActionStep({
        component: newStateComponent.uuid,
        methodName: newStateMethod,
        params: newStateParams
      });
      console.debug('[STATES-LANE] Created new state', newState);
    }
    onChange([...subsystem.states]);
    closeDialog();
  }

  const closeDialog = () => {
    setShowCreateStateDialog(false);
    setEditedState(null);
    setNewStateName(null);
    setNewStateComponent(null);
    setNewStateMethod(null);
    setNewStateParams([]);
  }

  return (
    <Box className="subsystem-lane states-lane">
      <h3>States</h3>
      <Dialog open={ showCreateStateDialog }>
        <DialogTitle>{ editedState ? 'Edit ' : 'Create '} State</DialogTitle>
        <DialogContent>
          <TextField label="Name"
                     variant="standard"
                     value={ newStateName }
                     onChange={ (e) => setNewStateName(e.target.value) }/>
          <StepEditor subsystem={ subsystem }
                      component={ newStateComponent }
                      methodName={ newStateMethod }
                      params={ newStateParams }
                      previousSteps={ [] }
                      componentMapper={ null }
                      methodMapper={ (methods) => {
                        const nonVoidMethods = methods.filter(m => m.returns !== 'void');
                        const booleansFirst = (a: MethodDefinition, b: MethodDefinition): number => {
                          return ((b.hints.includes("state") as unknown as number) - (a.hints.includes("state") as unknown as number)) ||
                            (((b.returns === "boolean") as unknown as number) - ((a.returns === "boolean") as unknown as number)) ||
                            (((b.returns === "double") as unknown as number) - ((a.returns === "double") as unknown as number)) ||
                            0;
                        }
                        const sortedMethods = nonVoidMethods.sort(booleansFirst);
                        console.debug('Sorted methods', sortedMethods.map(m => m.name));
                        return sortedMethods;
                      } }
                      onMethodChange={ (component, methodName, params) => {
                        setNewStateComponent(component);
                        setNewStateMethod(methodName);
                        setNewStateParams(params);
                      } }/>
          <SyntaxHighlighter language="java" style={ SyntaxHighlightStyles.vs }>
            { (() => {
              const dummyState = new SubsystemState(newStateName ?? 'Unnamed State', subsystem.uuid);
              dummyState.step = new SubsystemActionStep({
                component: newStateComponent?.uuid,
                methodName: newStateMethod,
                params: newStateParams
              });
              return generateState(dummyState, subsystem);
            })() }
          </SyntaxHighlighter>
        </DialogContent>
        <DialogActions>
          <Button onClick={ closeDialog }>Cancel</Button>
          <Button onClick={ () => createState() } disabled={ !newStateName }>OK</Button>
        </DialogActions>
      </Dialog>
      <Box className="subsystem-lane-items">
        {
          states.map(state => {
            return (
              <Card key={ state.uuid } className="subsystem-lane-item" component={ Paper }>
                { state.name }
                <Button onClick={ () => {
                  setNewStateName(state.name);
                  if (state.step) {
                    setNewStateComponent(subsystem.components.find(c => c.uuid === state.step.component));
                    setNewStateMethod(state.step.methodName);
                    setNewStateParams([...state.step.params]);
                  }
                  setEditedState(state);
                  setShowCreateStateDialog(true);
                } }>
                  Edit
                </Button>
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

                    const newInvocation: ActionParamCallOption = ActionParamCallOption.fromObjects(action, param, optType, hardCodedValue);
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
                       const newParam = ActionParamCallOption.fromObjects(action, param, "hardcode", hardCodedValue);
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

function NewSubsystemsPane({ acceptNewSubsystem }: { acceptNewSubsystem: (Subsystem) => void }) {
  const newDriveBase = () => {
    const driveBase = differentialDrivebaseTemplate();
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
            title={ "A robot has to move around somehow!  This supports the three most common drive train types: differential drives (also called skid-steer or tank drive); swerve drives; and mecanum drives." }>
            <h3>Drivetrain</h3>
          </Tooltip>
          <img src={ "logo192.png" } alt={ "" } title={ "DRIVETRAIN IMAGE" }/>
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
