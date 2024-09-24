import {Project} from "../../bindings/Project";
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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Select,
  SxProps,
  Tab,
  Tabs,
  TextField,
  Theme,
  Tooltip
} from "@mui/material";
import React, {CSSProperties, useEffect, useState} from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SyntaxHighlighter from 'react-syntax-highlighter';
import * as SyntaxHighlightStyles from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {ComponentDefinition, MethodDefinition, ParameterDefinition} from "../../components/ComponentDefinition";
import {generateCommand} from "../../codegen/java/CommandGenerator";
import {generateSubsystem} from "../../codegen/java/SubsystemGenerator";
import {generateAction_future} from "../../codegen/java/ActionGenerator";
import {generateState} from "../../codegen/java/StateGenerator";
import {differentialDrivebaseTemplate} from "../../templates/DifferentialDrivebase";
import {ComponentColumn} from "./ComponentColumn";
import {COMPONENT_DEFINITIONS} from "../../components/ComponentDefinitions";
import {HelpableLabel} from "../HelpableLabel";
import {ChevronRightSharp} from "@mui/icons-material";
import SubsystemName from "../SubsystemName";
import SubsystemActionName from "../SubsystemActionName";
import SubsystemStateName from "../SubsystemStateName";


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

  const columnHeaderSx: SxProps<Theme> = {
    // fontWeight: '400',
    // '&.Mui-expanded': {
    //   backgroundColor: "#333",
    //   color: '#eee',
    //   fontWeight: 'bold'
    // }
    fontWeight: 'bold',
    backgroundColor: '#eee',
  };

  const onComponentChange = (component: SubsystemComponent) => {
    setGeneratedCode(generateSubsystem(subsystem, project));
  }

  const onComponentAdd = (componentDef: ComponentDefinition) => {
    const newComponent = new SubsystemComponent(`New ${ componentDef.name }`, componentDef, {});
    subsystem.components.push(newComponent);
    switch (componentDef.type) {
      case "actuator":
        setActuators(subsystem.getActuators());
        break;
      case "sensor":
        setSensors(subsystem.getSensors());
        break;
      case "control":
        setControls(subsystem.getControls());
        break;
    }
  }

  const onComponentDelete = (removedComponent: SubsystemComponent) => {
    subsystem.components = subsystem.components.filter(c => c !== removedComponent);
    switch (removedComponent.definition.type) {
      case "actuator":
        setActuators(subsystem.getActuators());
        break;
      case "sensor":
        setSensors(subsystem.getSensors());
        break;
      case "control":
        setControls(subsystem.getControls());
        break;
    }
  }

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
      const newCommands = [...commands];
      subsystem.commands = newCommands;
      setCommands(newCommands);
    } else {
      const newCommand = data.toCommand();
      const newCommands = commands.concat(newCommand);
      subsystem.commands = newCommands;
      setCommands(newCommands);
    }
    setEditedCommand(null);
    setCommandDialogType(null);
    setShowCreateCommandDialog(false);
  }

  const [editedAction, setEditedAction] = useState(null as SubsystemAction)
  const [showCreateActionDialog, setShowCreateActionDialog] = useState(false);

  const closeActionDialog = () => {
    setShowCreateActionDialog(false);
    setEditedAction(null);
  }

  const createAction = (data: ActionParams) => {
    const newAction = subsystem.createAction(data.name);
    newAction.steps = [...data.steps];
    newAction.regenerateParams(subsystem);
    const newActions = subsystem.actions;
    subsystem.actions = [...newActions];
    setActions(subsystem.actions);
    closeActionDialog();
  }

  const [editedState, setEditedState] = useState(null as SubsystemState);
  const [showCreateStateDialog, setShowCreateStateDialog] = useState(false);

  const createState = (data) => {
    const newState = subsystem.createState(data.name);
    newState.step = new SubsystemActionStep({
      component: data.component,
      methodName: data.method,
      params: data.params
    });
    subsystem.states = [...subsystem.states];
    setStates(subsystem.states);
    closeStateDialog();
  }

  const closeStateDialog = () => {
    setShowCreateStateDialog(false);
    setEditedState(null);
  }

  useEffect(() => {
    closeActionDialog();
    closeStateDialog();
  }, [subsystem]);

  return (
    <Box className="subsystem-pane" style={ {} }>
      <CreateCommandDialog subsystem={ subsystem }
                           onCancel={ () => setShowCreateCommandDialog(false) }
                           onAccept={ createCommand }
                           defaultOpen={ showCreateCommandDialog }
                           editedCommand={ editedCommand }
                           type={ commandDialogType }/>

      <CreateActionDialog open={ showCreateActionDialog }
                          subsystem={ subsystem }
                          editedAction={ editedAction }
                          onCancel={ closeActionDialog }
                          onCreate={ (data) => createAction(data) }
                          onUpdate={ ({ name, steps }) => {
                            closeActionDialog();
                            editedAction.name = name;
                            editedAction.steps = [...steps];
                            editedAction.regenerateParams(subsystem);

                            // Find the command that use the edited action, then remove any of their defined parameters that
                            // pass through to a no longer defined param on the action.
                            // Otherwise commands would have dangling references to nonexistent action params with no way to remove them
                            subsystem.commands.filter(c => c.callsAction(editedAction)).forEach(command => {
                              // Make sure any calling commands are updated to account for the action changes to the action
                              command.params = command.params.filter(commandParamDef => {
                                return commandParamDef.action === editedAction.uuid && !editedAction.params.find(ap => ap.uuid === commandParamDef.param);
                              });
                            })
                            subsystem.actions = [...subsystem.actions];
                            setActions(subsystem.actions);
                            setEditedAction(null);
                          } }/>

      <CreateStateDialog open={ showCreateStateDialog }
                         subsystem={ subsystem }
                         editedState={ editedState }
                         onCancel={ closeStateDialog }
                         onCreate={ (data) => createState(data) }
                         onUpdate={ (data) => {
                           closeStateDialog();
                           editedState.name = data.name;
                           editedState.step = new SubsystemActionStep({
                             component: data.component,
                             methodName: data.method,
                             params: data.params
                           });
                           subsystem.states = [...subsystem.states];
                           setStates(subsystem.states);
                           setEditedState(null);
                         } }/>

      <div className="components-sidebar">
        <Accordion id="actuators-panel" className="component-column-accordion" square>
          <AccordionSummary id="actuators-panel-header" className="component-column-header" sx={ columnHeaderSx }>
            <span>Outputs</span>
          </AccordionSummary>
          <AccordionDetails style={{ padding: 0 }}>
            <ComponentColumn components={ actuators } subsystem={ subsystem } onChange={ onComponentChange } onDelete={ onComponentDelete }/>
            <div className="add-components-carousel" id="add-actuators-carousel">
              {
                COMPONENT_DEFINITIONS.definitions.filter(d => d.type === "actuator").map(actuatorDef => {
                  return (
                    <Button id={ `add-${actuatorDef.id}-button`}
                            className="add-component-button add-actuator-button"
                            key={ actuatorDef.id }
                            onClick={ (e) => onComponentAdd(actuatorDef) }>
                      Add { actuatorDef.name }
                    </Button>
                  )
                })
              }
            </div>
          </AccordionDetails>
        </Accordion>
        <Accordion id="sensors-panel" className="component-column-accordion" square>
          <AccordionSummary id="sensors-panel-header" className="component-column-header" sx={ columnHeaderSx }>
            <span>Inputs</span>
          </AccordionSummary>
          <AccordionDetails style={{ padding: 0 }}>
            <ComponentColumn components={ sensors } subsystem={ subsystem } onChange={ onComponentChange } onDelete={ onComponentDelete }/>
            <div className="add-components-carousel" id="add-sesnors-carousel">
              {
                COMPONENT_DEFINITIONS.definitions.filter(d => d.type === "sensor").map(sensorDef => {
                  return (
                    <Button id={ `add-${sensorDef.id}-button`}
                            className="add-component-button add-sensor-button"
                            key={ sensorDef.id }
                            onClick={ (e) => onComponentAdd(sensorDef) }>
                      Add { sensorDef.name }
                    </Button>
                  )
                })
              }
            </div>
          </AccordionDetails>
        </Accordion>
        <Accordion id="controls-panel" className="component-column-accordion" square>
          <AccordionSummary id="controls-panel-header" className="component-column-header" sx={ columnHeaderSx }>
            <span>Controls</span>
          </AccordionSummary>
          <AccordionDetails style={{ padding: 0 }}>
            <ComponentColumn components={ controls } subsystem={ subsystem } onChange={ onComponentChange } onDelete={ onComponentDelete }/>
            <div className="add-components-carousel" id="add-controls-carousel">
              {
                COMPONENT_DEFINITIONS.definitions.filter(d => d.type === "control").map(controlDef => {
                  return (
                    <Button id={ `add-${controlDef.id}-button`}
                            className="add-component-button add-control-button"
                            key={ controlDef.id }
                            onClick={ (e) => onComponentAdd(controlDef) }>
                      Add { controlDef.name }
                    </Button>
                  )
                })
              }
            </div>
          </AccordionDetails>
        </Accordion>
        <Accordion id="actions-panel" className="component-column-accordion" square>
          <AccordionSummary className="component-column-header" sx={ columnHeaderSx }>
            <span>Actions</span>
          </AccordionSummary>
          <AccordionDetails style={{ padding: 0 }}>
            <div>
              {
                subsystem.actions.map(action => {
                  return (
                    <Accordion key={ action.uuid }>
                      <AccordionSummary>
                        { action.name }
                      </AccordionSummary>
                      <AccordionDetails>
                        <ol className="subsystem-action-steps-list">
                        {
                          action.steps.map((step, index) => {
                            const component = subsystem.components.find(c => c.uuid === step.component);
                            const method = component.definition.methods.find(m => m.codeName === step.methodName);
                            const isAccessor = method.parameters.length === 0 && method.returns !== 'void';
                            return (
                              <li>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span className="subsystem-component-name">
                                  { component.name }
                                  </span>
                                  <ChevronRightSharp style={{ height: '16px' }}/>
                                  <HelpableLabel description={ method.description }>
                                    <SubsystemActionName name={ method.name }/>
                                  </HelpableLabel> 
                                </div>

                                {
                                  (step.params.length > 0) ? (
                                <table className="subsystem-action-step-parameters-table">
                                  <thead>
                                    <tr>
                                      <th>Parameter</th>
                                      <th>Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                {
                                  step.params.map(param => {
                                    const realParam = method.parameters.find(p => p.codeName === param.paramName);
                                    return (
                                      <tr>
                                        <td>
                                          <HelpableLabel description={ realParam.description }>
                                            <span className="subsystem-action-step-param-name">{ realParam.name }</span>
                                          </HelpableLabel>
                                        </td>
                                        <td>{ (() => {
                                          const arg = param.arg;
                                          switch (arg.type) {
                                            case "hardcode":
                                              return (<span><code className="hardcoded-value">{ arg.hardcodedValue }</code></span>);
                                            case "define-passthrough-value":
                                              return (<span style={{ color: '#aaa' }}>specified when the action runs</span>);
                                            case "reference-passthrough-value":
                                              return 'is unknown';
                                            case "reference-step-output":
                                              const referencedStep = action.steps.find(s => s.uuid === arg.step);
                                              const referencedComponent = subsystem.components.find(c => c.uuid === referencedStep.component);
                                              const referencedMethod = referencedComponent.definition.methods.find(m => m.codeName === referencedStep.methodName);
                                              return (<span>result of <SubsystemActionName name={ referencedMethod.name }/> from <span className="subsystem-component-name">{ referencedComponent.name }</span></span>);
                                            default:
                                              return 'is unknown';
                                          }
                                        })() }
                                        </td>
                                      </tr>
                                    )
                                  })
                                }
                                  </tbody>
                                </table>
                                  ) : <></>
                              }
                              </li>
                            )
                          })
                        }
                        </ol>
                        <div>
                          <Button onClick={(e) => { setEditedAction(action); setShowCreateActionDialog(true); }}>
                            Edit
                          </Button>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  )
                })
              }

              <Button id="add-action-button"
                      className="add-component-button add-action-button"
                      onClick={(e) => setShowCreateActionDialog(true)}>
                + Add Action
              </Button>
            </div>
          </AccordionDetails>
        </Accordion>
        <Accordion id="states-panel" className="component-column-accordion" square>
          <AccordionSummary className="component-column-header" sx={ columnHeaderSx }>
            <span>States</span>
          </AccordionSummary>
          <AccordionDetails style={{ padding: 0 }}>
            <div>
              {
                subsystem.states.map(state => {
                  return (
                    <Accordion key={ state.uuid }>
                      <AccordionSummary>
                        { state.name }
                      </AccordionSummary>
                      <AccordionDetails>
                        {
                          (() => {
                            if (state.step) {
                              let component = subsystem.components.find(c => c.uuid === state.step.component);
                              return `${ component.name } ${ component.definition.methods.find(m => m.codeName === state.step.methodName).name }`;
                            }
                          })()
                        }
                        <div>
                          <Button onClick={(e) => { setEditedState(state); setShowCreateStateDialog(true); } }>
                            Edit
                          </Button>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  )
                })
              }

              <Button id="add-state-button"
                      className="add-component-button add-state-button"
                      onClick={(e) => setShowCreateStateDialog(true)}>
                + Add State
              </Button>
            </div>
          </AccordionDetails>
        </Accordion>
        <Accordion id="commands-panel" className="component-column-accordion" square>
          <AccordionSummary className="component-column-header" sx={ columnHeaderSx }>
            <span>Commands</span>
          </AccordionSummary>
          <AccordionDetails style={{padding: 0}}>
            <div>
              {
                subsystem.commands.map(command => {
                  return (
                    <Accordion key={command.uuid}>
                      <AccordionSummary>
                        {command.name}
                      </AccordionSummary>
                      <AccordionDetails>
                        <div>
                          Run <SubsystemActionName action={subsystem.actions.find(a => a.uuid === command.action) } /> {
                            (() => {
                              switch (command.endCondition) {
                                case undefined:
                                case null:
                                  break;
                                case "forever":
                                  return <span>until it is cancelled or interrupted</span>;
                                case "once":
                                  return <span>exactly once</span>;
                                default:
                                  // state UUID
                                  const endState = subsystem.states.find(s => s.uuid === command.endCondition);
                                  return (<span>until the <SubsystemName subsystem={subsystem} /> has reached <SubsystemStateName state={endState}/></span>);
                              }
                            })()
                          }
                        </div>
                        <Button onClick={(e) => { setEditedCommand(command); setShowCreateCommandDialog(true); } }>
                          Edit
                        </Button>
                      </AccordionDetails>
                    </Accordion>
                  )
                })
              }
            </div>
            <div className="add-components-carousel" id="add-commands-carousel">
              <Button id="add-command-button"
                      className="add-component-button add-command-button"
                      onClick={(e) => setShowCreateCommandDialog(true)}>
                + Add Command
              </Button>
            </div>
          </AccordionDetails>
        </Accordion>
      </div>
      <div style={{ height: '100%', overflow: 'scroll' }}>
        <SyntaxHighlighter
          language="java"
          style={ SyntaxHighlightStyles.vs }
          showLineNumbers={ true }
          wrapLines={ true }
          lineProps={ (lineNumber: number): { style: React.CSSProperties } => {
            const style: CSSProperties = { display: "block", fontSize: '10pt' };
            return { style };
          } }
        >
          { generatedCode }
        </SyntaxHighlighter>
      </div>
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

type StateParams = {
  name: string,
  component: UUID,
  method: string,
  params: StepParam[]
};

type CreateStateDialogProps = {
  open: boolean;
  subsystem: Subsystem;
  editedState: SubsystemState | null;
  onCancel: () => void;
  onCreate: (data: StateParams) => void;
  onUpdate: (data: StateParams) => void;
};

function CreateStateDialog({
                             open,
                             subsystem,
                             editedState,
                             onCancel,
                             onCreate,
                             onUpdate
                           }: CreateStateDialogProps) {

  const [stateName, setStateName] = useState(editedState?.name as string);
  const [stateComponent, setStateComponent] = useState(subsystem.components.find(c => editedState?.step?.component && editedState.step.component === c.uuid) as SubsystemComponent);
  const [stateMethod, setStateMethod] = useState(editedState?.step?.methodName as string);
  const [stateParams, setStateParams] = useState(editedState?.step?.params ?? [] as StepParam[]);

  useEffect(() => {
    const pullEditedData = open && !!editedState;
    setStateName(pullEditedData ? editedState.name : null);
    setStateComponent(pullEditedData ? subsystem.components.find(c => editedState.step?.component === c.uuid) : null);
    setStateMethod(pullEditedData ? editedState.step?.methodName : null);
    setStateParams(pullEditedData ? editedState.step?.params : []);
  }, [open, editedState]);

  return (
    <Dialog open={ open }>
      <DialogTitle>{ editedState ? 'Edit ' : 'Create '} State</DialogTitle>
      <DialogContent>
        <TextField label="Name"
                   variant="standard"
                   value={ stateName }
                   onChange={ (e) => setStateName(e.target.value) }/>
        <StepEditor subsystem={ subsystem }
                    component={ stateComponent }
                    methodName={ stateMethod }
                    params={ stateParams }
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
                      return nonVoidMethods.sort(booleansFirst);
                    } }
                    onMethodChange={ (component, methodName, params) => {
                      setStateComponent(component);
                      setStateMethod(methodName);
                      setStateParams(params);
                    } }/>
        <SyntaxHighlighter language="java" style={ SyntaxHighlightStyles.vs }>
          { (() => {
            const dummyState = new SubsystemState(stateName ?? 'Unnamed State', subsystem.uuid);
            dummyState.step = new SubsystemActionStep({
              component: stateComponent?.uuid,
              methodName: stateMethod,
              params: stateParams
            });
            return generateState(dummyState, subsystem);
          })() }
        </SyntaxHighlighter>
      </DialogContent>
      <DialogActions>
        <Button onClick={ onCancel }>Cancel</Button>
        <Button onClick={ () => {
          const data: StateParams = {
            name: stateName,
            component: stateComponent?.uuid,
            method: stateMethod,
            params: stateParams
          };
          !!editedState ? onUpdate(data) : onCreate(data)
        } } disabled={ !stateName }>OK</Button>
      </DialogActions>
    </Dialog>
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
          Using the <SubsystemName subsystem={subsystem}/> subsystem,
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
                    <SubsystemActionName action={ action }/>
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
                    <SubsystemActionName action={ action }/>
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
                  defaultValue={ editedCommand?.endCondition || "forever" }>
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
                    <SubsystemName subsystem={subsystem}/> reaches <SubsystemStateName state={state}/>
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

            // return !selectedAction || !endCondition || !commandName;
            return !commandName;
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
      <Button id="subsystem-button-drivetrain" onClick={ newDriveBase }>
        <Box>
          <Tooltip
            title={ "A robot has to move around somehow!  This supports the three most common drive train types: differential drives (also called skid-steer or tank drive); swerve drives; and mecanum drives." }>
            <h3>Drivetrain</h3>
          </Tooltip>
          <img src={ "logo192.png" } alt={ "" } title={ "DRIVETRAIN IMAGE" }/>
        </Box>
      </Button>
      <Button id="subsystem-button-single-jointed-arm" onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip title={ "A rotating arm with a single pivot point" }>
            <h3>Single-Jointed Arm</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button id="subsystem-button-double-jointed-arm" onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip title={ "A rotating arm with two pivot points" }>
            <h3>Double-Jointed Arm</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button id="subsystem-button-wrist" onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip
            title={ "A wrist at the end of an arm, or a low-mass pivoting mechanism that doesn't require sophisticated controls like an arm would" }>
            <h3>Wrist</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button id="subsystem-button-elevator" onClick={ () => alert('Not implemented yet') }>
        <Box>
          <Tooltip
            title={ "A subsystem that has a linear extension and retraction. This could be vertical, in the case of a traditional elevator, or angled, or even horizontal" }
          >
            <h3>Elevator</h3>
          </Tooltip>
          <img src={ "logo192.png" }/>
        </Box>
      </Button>
      <Button id="subsystem-button-blank" onClick={ () => {
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
