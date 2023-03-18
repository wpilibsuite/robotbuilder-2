import { Project } from "../../bindings/Project";
import {
  ActionParamCallOption,
  AtomicCommand,
  EndCondition,
  Param,
  Subsystem, SubsystemAction,
  SubsystemComponent, SubsystemState
} from "../../bindings/Command";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, Input,
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
import { ComponentDefinition } from "../../components/ComponentDefinition";
import { COMPONENT_DEFINITIONS } from "../../components/ComponentDefinitions";
import { generateCommand } from "../../codegen/java/CommandGenerator";
import { generateSubsystem } from "../../codegen/java/SubsystemGenerator";

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

type ActuatorsLaneProps = {
  subsystem: Subsystem;
  actuators: SubsystemComponent[];
  onChange: (newActuators: SubsystemComponent[]) => void;
};

function ActuatorsLane({ subsystem, actuators, onChange }: ActuatorsLaneProps) {
  const [showNewActuatorDialog, setShowNewActuatorDialog] = useState(false);

  const [newActuatorDefinition, setNewActuatorDefinition] = useState(null as ComponentDefinition);
  const [newActuatorName, setNewActuatorName] = useState(null);
  const [newActuatorProperties, setNewActuatorProperties] = useState(null);

  return (
    <Box className="subsystem-lane actuators-lane">
      <h3>Actuators</h3>
      <Box className="subsystem-lane-items">
        {
          actuators.map(component => {
            return (
              <Card key={ component.uuid } className="subsystem-lane-item" component={ Paper }>
                { component.name }
              </Card>
            )
          })
        }
        <Button onClick={ () => {
          setNewActuatorName(null);
          setNewActuatorDefinition(null);
          setNewActuatorProperties(null);
          setShowNewActuatorDialog(true);
        } }>
          + Add Actuator
        </Button>
      </Box>
      <Dialog open={ showNewActuatorDialog }>
        <DialogTitle>
          Add New Actuator
        </DialogTitle>
        <DialogContent>
          <Box style={ { display: "grid", gridTemplateColumns: "150px minmax(200px, 1fr)" } }>
            <label>Name</label>
            <TextField onChange={ (e) => setNewActuatorName(e.target.value) } defaultValue={ "" } variant="standard"/>

            <label>Choose a type</label>
            <Select onChange={ (e) => {
              setNewActuatorDefinition(COMPONENT_DEFINITIONS.forId(e.target.value));
              setNewActuatorProperties({}); // clear any saved properties from the previous selection
            } } defaultValue={ "" } variant="standard">
              { COMPONENT_DEFINITIONS.definitions.filter(d => d.type === "actuator").map(definition => {
                return (
                  <MenuItem value={ definition.id } key={ definition.id }>
                    { definition.name }
                  </MenuItem>
                )
              }) }
            </Select>

            {
              newActuatorDefinition ? (
                newActuatorDefinition.properties.map(prop => {
                  return (
                    [
                      <label key={ `prop-label-${ prop.name }` }>
                        { prop.name }
                      </label>,
                      (() => {
                        switch (prop.type) {
                          case "int":
                          case "long":
                          case "double":
                            // TODO: Allow integer only input for int/long.  Maybe allow props to define pass/reject functions?
                            return <Input type="number" key={ `prop-input-${ prop.name }` } onChange={ (e) => {
                              const props = { ...newActuatorProperties };
                              props[prop.codeName] = e.target.value;
                              setNewActuatorProperties(props);
                            } }/>
                          default:
                            if (prop.type.startsWith("vararg")) {
                              // assume variadic components because variadic primitives is odd
                              // components is also easy to implement with a multiple-select dropdown
                              const type = prop.type.split("vararg ")[1];
                              console.log(type);
                              switch (type) {
                                case "boolean":
                                case "int":
                                case "long":
                                case "double":
                                case "string":
                                  return (<span>Vararg primitive types not yet supported</span>);
                              }
                              return (
                                <Autocomplete multiple
                                              onChange={ (event, newValue: SubsystemComponent[]) => {
                                                console.log('Selected vararg options', newValue);
                                                const props = { ...newActuatorProperties }
                                                props[prop.codeName] = newValue.map(component => component.uuid);
                                                setNewActuatorProperties(props);
                                              } }
                                              options={ subsystem.components.filter(c => c.definition.wpilibApiTypes.find(t => t === type)) }
                                              getOptionLabel={ (option) => option.name }
                                              renderInput={ (params) => {
                                                return <TextField { ...params }
                                                                  placeholder={ `Select one or more ${ type }` }/>;
                                              } }
                                />
                              );
                            } else {
                              // assume it's a custom type - look for components with an API type that matches and offer them in a select box
                              // TODO: Prevent the same component from being selected for multiple properties
                              return (
                                <Select key={ `select-${ prop.name }` } variant="standard" onChange={ (e) => {
                                  const props = { ...newActuatorProperties };
                                  props[prop.codeName] = e.target.value;
                                  setNewActuatorProperties(props);
                                } }>
                                  {
                                    subsystem.components
                                      .filter(c => c.definition.wpilibApiTypes.find(t => t === prop.type))
                                      .map(c => {
                                        return (
                                          <MenuItem key={ c.uuid } value={ c.uuid }>
                                            { c.name }
                                          </MenuItem>
                                        )
                                      })
                                  }
                                </Select>
                              )
                            }
                        }
                      })()
                    ]
                  );
                })
              ) : <></>
            }
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => setShowNewActuatorDialog(false) }>Cancel</Button>
          <Button onClick={ () => {
            if (newActuatorName && newActuatorDefinition && newActuatorProperties) {
              const newActuator = new SubsystemComponent(newActuatorName, newActuatorDefinition, newActuatorProperties);
              console.debug('Created new actuator component', newActuator);
              onChange(actuators.concat(newActuator));
            } else {
              console.debug('Not enough information provided, not creating an actuator');
            }
            setShowNewActuatorDialog(false);
          } }>
            OK
          </Button>
        </DialogActions>
      </Dialog>
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
      <SensorsLane sensors={ sensors } onChange={ setSensors }/>
      <ActuatorsLane subsystem={ subsystem }
                     actuators={ actuators }
                     onChange={ (newActuators) => {
                       console.log('Setting actuators to', newActuators);
                       const added = newActuators.filter(a => !subsystem.components.includes(a))
                       const removed = subsystem.getActuators().filter(a => !newActuators.includes(a));
                       subsystem.components = subsystem.components.filter(c => c.type !== "actuator" || !removed.includes(c)).concat(...added);
                       setActuators(newActuators);
                     } }/>
      <ControlsLane subsystem={ subsystem } project={ project }/>
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

function ActionsLane({
                       subsystem,
                       actions,
                       onChange
                     }: { subsystem: Subsystem, actions: SubsystemAction[], onChange: (newActions: SubsystemAction[]) => void }) {
  const [showCreateActionDialog, setShowCreateActionDialog] = useState(false);
  const [newActionName, setNewActionName] = useState(null);
  const [newActionParams, setNewActionParams] = useState([]);

  useEffect(() => {
    setShowCreateActionDialog(false);
    setNewActionName(null);
    setNewActionParams([])
  }, [subsystem]);

  const createAction = (data) => {
    console.log(data);
    const newAction = subsystem.createAction(data.name);
    newAction.params = data.params;

    console.debug('Created new action', newAction);
    onChange([...subsystem.actions]);
    closeDialog();
  }

  const closeDialog = () => {
    setShowCreateActionDialog(false);
    setNewActionName(null);
    setNewActionParams([]);
  }

  return (
    <Box className="subsystem-lane actions-lane">
      <h3>Actions</h3>
      <Dialog open={ showCreateActionDialog }>
        <DialogTitle>Create Action</DialogTitle>
        <DialogContent>
          <TextField label="Name" variant="standard" onChange={ (e) => setNewActionName(e.target.value) }/>
          {
            newActionParams.map((param: Param) => {
              return (
                <div key={ param.uuid } className="action-param">
                  <TextField variant="standard"
                             defaultValue={ param.name ?? '' }
                             onChange={ (e) => {
                               param.name = e.target.value;
                               setNewActionParams([...newActionParams]);
                             } }/>
                  <Select variant="standard"
                          onChange={ (e) => {
                            param.type = e.target.value as string;
                            setNewActionParams([...newActionParams]);
                          } }>
                    <MenuItem value="int" key={ 'int-select' }>Int</MenuItem>
                    <MenuItem value="long" key={ 'long-select' }>Long</MenuItem>
                    <MenuItem value="double" key={ 'double-select' }>Double</MenuItem>
                    <MenuItem value="boolean" key={ 'boolean-select' }>Boolean</MenuItem>
                  </Select>
                  <Button onClick={ () => {
                    console.log('Deleting param', param);
                    setNewActionParams(newActionParams.filter(p => p !== param));
                  } }>
                    -
                  </Button>
                </div>
              )
            })
          }
          <Button onClick={ () => {
            const param = new Param();
            console.log("Adding param", param);
            setNewActionParams(newActionParams.concat(param));
          } }>
            +
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => closeDialog() }>Cancel</Button>
          <Button onClick={ () => createAction({ name: newActionName, params: newActionParams }) }
                  disabled={ !newActionName || !!newActionParams.find(p => !p.name || p.name === '' || !p.type || p.type === '') }>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Box className="subsystem-lane-items">
        {
          actions.map(action => {
            return (
              <Card key={ action.uuid } className="subsystem-lane-item" component={ Paper }>
                { action.name }
              </Card>
            )
          })
        }
        <Button onClick={ () => setShowCreateActionDialog(true) }>
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
  const [editedCommand, setEditedCommand] = useState(null);
  const [canAddCommand, setCanAddCommand] = useState(subsystem.actions.length > 0);

  useEffect(() => setCanAddCommand(subsystem.actions.length > 0), [subsystem.actions]);

  const createCommand = (data: NewCommandData) => {
    console.log(data);
    if (editedCommand) {
      editedCommand.name = data.name;
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
  readonly action: string; // UUID
  readonly endCondition: EndCondition;
  readonly params: ActionParamCallOption[];

  constructor(name, subsystem, action, endCondition, params) {
    this.name = name;
    this.subsystem = subsystem;
    this.action = action;
    this.endCondition = endCondition;
    this.params = params;
  }

  toCommand(): AtomicCommand {
    const command = new AtomicCommand();
    command.name = this.name;
    command.subsystem = this.subsystem;
    command.action = this.action;
    command.endCondition = this.endCondition;
    command.params = [...this.params];
    return command;
  }
}


function CreateCommandDialog({
                               subsystem,
                               onCancel,
                               onAccept,
                               defaultOpen,
                               type,
                               editedCommand
                             }: { subsystem: Subsystem, onCancel: () => void, onAccept: (string) => void, defaultOpen: boolean, type: "create" | "edit", editedCommand: AtomicCommand | null }) {
  const [selectedAction, setSelectedAction] = useState(editedCommand?.action);
  const [endCondition, setEndCondition] = useState(editedCommand?.endCondition);
  const [commandName, setCommandName] = useState(editedCommand?.name);
  const [params, setParams] = useState(editedCommand?.params ?? []);

  // doesn't clear properly when hitting +add command, closing, then re-opening
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
                  subsystem.actions.find(action => action.uuid === selectedAction).params.map(param => {
                    const action = subsystem.actions.find(action => action.uuid === selectedAction);

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
                                       params.find(p => p.param === param.uuid).hardcodedValue = hardCodedValue;
                                       setParams([...params]);
                                     } }/>
                        </span>
                      ]
                    );
                  })
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
                  return generateCommand(commandName, subsystem, selectedAction, endCondition, params);
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
            onAccept(new NewCommandData(commandName, subsystem.uuid, selectedAction, endCondition, params));
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
      name: "set",
      hints: ["action", "motor-input"],
      parameters: [
        { name: "speed", type: "double" }
      ],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "CAN ID",
      codeName: "deviceNumber",
      type: "int",
      setInConstructor: true,
      getter: {
        name: "getDeviceID",
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
      name: "set",
      hints: ["action", "motor-input"],
      parameters: [
        { name: "speed", type: "double" }
      ],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "Motors",
      codeName: "motors",
      type: "vararg MotorController",
      setInConstructor: true
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
      name: "arcadeDrive",
      hints: ["action", "joystick-input"],
      parameters: [
        { name: "xSpeed", type: "double" },
        { name: "zRotation", type: "double" },
        { name: "squareInputs", type: "boolean", optional: true }
      ],
      returns: "void"
    },
    {
      name: "tankDrive",
      hints: ["action", "joystick-input"],
      parameters: [
        { name: "leftSpeed", type: "double" },
        { name: "rightSpeed", type: "double" },
        { name: "squareInputs", type: "boolean", optional: true }
      ],
      returns: "void"
    }
  ],
  properties: [
    {
      name: "Left Motor",
      codeName: "leftMotor",
      type: "MotorController",
      setInConstructor: true
    },
    {
      name: "Right Motor",
      codeName: "rightMotor",
      type: "MotorController",
      setInConstructor: true
    }
  ]
}

COMPONENT_DEFINITIONS.addDefinition(CAN_TALON_FX);
COMPONENT_DEFINITIONS.addDefinition(MOTOR_CONTROLLER_GROUP);
COMPONENT_DEFINITIONS.addDefinition(DIFFERENTIAL_DRIVE);

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

  drivebase.components = [frontLeftMotor, backLeftMotor, frontRightMotor, backRightMotor, leftMotorGroup, rightMotorGroup, differentialDrive];

  const stopAction = drivebase.createAction("Stop");
  const tankDriveAction = drivebase.createAction("Tank Drive");
  tankDriveAction.params = [
    Param.create("Left Speed", "double"),
    Param.create("Right Speed", "double"),
    Param.create("Squared Inputs", "boolean")
  ];
  const arcadeDriveAction = drivebase.createAction("Arcade Drive");
  arcadeDriveAction.params = [
    Param.create("Forward Speed", "double"),
    Param.create("Turning Speed", "double"),
    Param.create("Squared Inputs", "boolean")
  ]

  drivebase.createState("Stopped");

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
