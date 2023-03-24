import {
  ActionParamCallOption,
  AtomicCommand,
  Param,
  Subsystem,
  SubsystemAction,
  SubsystemActionStep,
  SubsystemComponent, SubsystemState
} from "../../bindings/Command";
import React, { useEffect, useState } from "react";
import {
  ActionTemplate, CommandTemplate,
  ComponentDefinition,
  ComponentType,
  StateTemplate
} from "../../components/ComponentDefinition";
import {
  Autocomplete,
  Box,
  Button,
  Card, Checkbox,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle, Divider, FormControlLabel, FormGroup,
  Input,
  Paper,
  Select,
  TextField, Tooltip
} from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { COMPONENT_DEFINITIONS } from "../../components/ComponentDefinitions";

type ComponentLaneProps = {
  subsystem: Subsystem;
  componentType: ComponentType;
  components: SubsystemComponent[];
  onChange: (newComponents: SubsystemComponent[]) => void;
};

export function ComponentLane({ subsystem, componentType, components, onChange }: ComponentLaneProps) {
  const [showNewComponentDialog, setShowNewComponentDialog] = useState(false);
  const [editedComponent, setEditedComponent] = useState(null as SubsystemComponent);

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    component: SubsystemComponent;
  } | null>(null);

  return (
    <Box className="subsystem-lane">
      <h3>{ componentType }</h3>
      <Box className="subsystem-lane-items">
        {
          components.map(component => {
            return [(
              <Card key={ component.uuid }
                    className="subsystem-lane-item"
                    component={ Paper }
                    onContextMenu={ (event: React.MouseEvent) => {
                      event.preventDefault();
                      setContextMenu(
                        contextMenu == null ?
                          { mouseX: event.clientX, mouseY: event.clientY, component: component } :
                          null
                      );
                    } }>
                { component.name }
                <Button onClick={ (e) => {
                  setEditedComponent(component);
                  setShowNewComponentDialog(true);
                } }>
                  Edit
                </Button>
              </Card>
            ),
              (
                <Menu open={ contextMenu?.component === component }
                      onClose={ (event, reason) => {
                        setContextMenu(null);
                      } }
                      anchorReference="anchorPosition"
                      anchorPosition={ contextMenu !== null ? {
                        left: contextMenu.mouseX,
                        top: contextMenu.mouseY
                      } : undefined }>
                  <MenuItem onClick={ (e) => {
                    setContextMenu(null);
                    // TODO: Display the "create" dialog as an "edit" dialog, like the command dialog does it
                  } }>
                    Rename
                  </MenuItem>
                  <MenuItem onClick={ (e) => {
                    setContextMenu(null);
                    onChange(components.filter(c => c !== component));
                  } }>
                    Delete
                  </MenuItem>
                </Menu>
              )
            ]
          })
        }
        <Button onClick={ () => {
          setEditedComponent(null);
          setShowNewComponentDialog(true);
        } }>
          + Add { componentType }
        </Button>
      </Box>

      <ComponentDialog open={ showNewComponentDialog }
                       componentType={ componentType }
                       subsystem={ subsystem }
                       editedComponent={ editedComponent }
                       onChange={ (changedComponent, generatedTemplates) => {
                         setShowNewComponentDialog(false);
                         setEditedComponent(null);
                         if (components.includes(changedComponent)) {
                           // was edited in place, just bubble up an alert about the change
                           onChange([...components]);
                         } else {
                           console.debug('[NEW-COMPONENT] Generating states, actions, and commands from templates', generatedTemplates);
                           const templates = changedComponent.definition.templates;
                           if (templates) {
                             const newStates = templates?.states.filter(ts => generatedTemplates.includes(ts)).map(stateTemplate => {
                               return null;
                             }).filter(s => !!s);
                             subsystem.states.push(...newStates);

                             const newActions = templates?.actions.filter(ta => generatedTemplates.includes(ta)).map(actionTemplate => {
                               return buildActionFromTemplate(actionTemplate, changedComponent, subsystem);
                             }).filter(a => !!a);
                             subsystem.actions.push(...newActions);

                             const newCommands = templates?.commands.filter(tc => generatedTemplates.includes(tc)).map(commandTemplate => {
                               return buildCommandFromTemplate(commandTemplate, changedComponent, subsystem, newStates, newActions);
                             }).filter(c => !!c);
                             subsystem.commands.push(...newCommands);
                           }

                           // new component, just stick it on the end of the list
                           onChange(components.concat(changedComponent));
                         }
                       } }
                       onCancel={ () => {
                         setShowNewComponentDialog(false);
                         setEditedComponent(null);
                       } }
      />
    </Box>
  );
}

type ComponentDialogProps = {
  open: boolean;
  componentType: string;
  subsystem: Subsystem;
  editedComponent: SubsystemComponent | null;
  onChange: (changedComponent: SubsystemComponent, generatedTemplates: (StateTemplate | ActionTemplate | CommandTemplate)[]) => void;
  onCancel: () => void;
}

function ComponentDialog({
                           open,
                           componentType,
                           subsystem,
                           editedComponent,
                           onChange,
                           onCancel
                         }: ComponentDialogProps) {
  const [newComponentName, setNewComponentName] = useState(null);
  const [newComponentDefinition, setNewComponentDefinition] = useState(null as ComponentDefinition);
  const [newComponentProperties, setNewComponentProperties] = useState(null);
  const [newComponentTemplates, setNewComponentTemplates] = useState([] as (StateTemplate | ActionTemplate | CommandTemplate)[]);

  useEffect(() => {
    console.debug(`[COMPONENT-DIALOG] Updating component name, definition, and properties after a change was detected.`, editedComponent);
    setNewComponentName(editedComponent?.name ?? '');
    setNewComponentDefinition(editedComponent?.definition ?? null);
    setNewComponentProperties(editedComponent ? { ...editedComponent.properties } : null);
  }, [open]);

  useEffect(() => {
    const allTemplates = newComponentDefinition?.templates;
    const stateNames = allTemplates?.states?.map(s => s.name);
    const actionNames = allTemplates?.actions?.map(a => a.name);
    const commandNames = allTemplates?.commands?.map(c => c.name);

    const t = [];
    if (stateNames) t.push(...stateNames.flatMap(n => allTemplates.states.filter(s => s.name === n)));
    if (actionNames) t.push(...actionNames.flatMap(n => allTemplates.actions.filter(s => s.name === n)));
    if (commandNames) t.push(...commandNames.flatMap(n => allTemplates.commands.filter(s => s.name === n)));
    setNewComponentTemplates(t);
    console.debug(`[COMPONENT-DIALOG] Templates:`, newComponentTemplates);
  }, [open, editedComponent, newComponentDefinition]);

  const isTemplateAvailable = (name: string): boolean => {
    console.debug(`[COMPONENT-DIALOG] Checking if template "${ name }" is available in`, newComponentTemplates);
    return !!newComponentTemplates.find(t => t.name === name);
  }

  return (
    <Dialog open={ open }>
      <DialogTitle>
        { editedComponent ? `Edit ${ componentType }` : `Create ${ componentType }` }
      </DialogTitle>
      <DialogContent>
        <Box style={ { display: "grid", gridTemplateColumns: "150px minmax(200px, 1fr)" } }>
          <label>Name</label>
          <TextField onChange={ (e) => setNewComponentName(e.target.value) }
                     value={ newComponentName ?? '' }
                     variant="standard"/>

          <label>Choose a type</label>
          <Select onChange={ (e) => {
            setNewComponentDefinition(COMPONENT_DEFINITIONS.forId(e.target.value));
            setNewComponentProperties({}); // clear any saved properties from the previous selection
          } } value={ newComponentDefinition?.id ?? '' }
                  variant="standard">
            { COMPONENT_DEFINITIONS.definitions.filter(d => d.type === componentType).map(definition => {
              return (
                <MenuItem value={ definition.id } key={ definition.id }>
                  { definition.name }
                </MenuItem>
              )
            }) }
          </Select>

          <h5>Properties</h5><span></span>

          {
            newComponentDefinition ? (
              newComponentDefinition.properties.map(prop => {
                return (
                  [
                    <Tooltip title={
                      <span>
                          { prop.description }
                        </span>
                    }>
                      <label key={ `prop-label-${ prop.name }` }>
                        { prop.name }
                      </label>
                    </Tooltip>,
                    (() => {
                      switch (prop.type) {
                        case "int":
                        case "long":
                        case "double":
                          // TODO: Allow integer only input for int/long.  Maybe allow props to define pass/reject functions?
                          // TODO: Checkbox or toggle for booleans?
                          return <Input type="number"
                                        key={ `prop-input-${ prop.name }` }
                                        value={ newComponentProperties[prop.codeName] ?? '' }
                                        onChange={ (e) => {
                                          const props = { ...newComponentProperties };
                                          props[prop.codeName] = e.target.value;
                                          setNewComponentProperties(props);
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
                                              const props = { ...newComponentProperties }
                                              props[prop.codeName] = newValue.map(component => component.uuid);
                                              setNewComponentProperties(props);
                                            } }
                                            options={ subsystem.components.filter(c => c.definition.wpilibApiTypes.find(t => t === type)) }
                                            value={ subsystem.components.filter(c => newComponentProperties[prop.codeName]?.includes(c.uuid)) }
                                            getOptionLabel={ (option) => option.name }
                                            renderInput={ (params) => {
                                              return <TextField { ...params }
                                                                placeholder={ `Select one or more ${ type }` }/>;
                                            } }
                              />
                            );
                          } else if (prop.options?.length > 0) {
                            // The definition specifies a set of options that can be selected from
                            return (
                              <Select key={ `select-${ prop.name } ` }
                                      value={ newComponentProperties[prop.codeName] ?? '' }
                                      variant="standard"
                                      onChange={ (e) => {
                                        const props = { ...newComponentProperties };
                                        props[prop.codeName] = e.target.value;
                                        setNewComponentProperties(props);
                                      } }
                              >
                                {
                                  prop.options.map((option, index) => {
                                    return (
                                      <MenuItem key={ index } value={ option.codeName }>
                                        { option.name }
                                      </MenuItem>
                                    )
                                  })
                                }
                              </Select>
                            );
                          } else {
                            // assume it's a custom type - look for components with an API type that matches and offer them in a select box
                            // TODO: Prevent the same component from being selected for multiple properties
                            return (
                              <Select key={ `select-${ prop.name }` }
                                      variant="standard"
                                      onChange={ (e) => {
                                        const props = { ...newComponentProperties };
                                        props[prop.codeName] = e.target.value;
                                        setNewComponentProperties(props);
                                      } }
                                      value={ newComponentProperties[prop.codeName] ?? '' }>
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

        <Divider/>
        <Box>
          {
            newComponentDefinition?.templates?.states?.map(stateTemplate => {
              const checkbox = (<FormGroup key={ stateTemplate.name }>
                <FormControlLabel label={ `Generate state: ${ stateTemplate.name }` }
                                  control={ <Checkbox key={ stateTemplate.name } onClick={ (e) => {
                                    if (newComponentTemplates.includes(stateTemplate)) {
                                      setNewComponentTemplates(newComponentTemplates.filter(t => t !== stateTemplate));
                                    } else {
                                      setNewComponentTemplates(newComponentTemplates.concat(stateTemplate));
                                    }
                                  } } checked={ isTemplateAvailable(stateTemplate.name) }/> }/>
              </FormGroup>);

              if (stateTemplate.description) {
                return (<Tooltip title={ stateTemplate.description } key={ stateTemplate.name }>
                  { checkbox }
                </Tooltip>)
              } else {
                return checkbox;
              }
            }) ?? null
          }
        </Box>

        <Divider/>
        <Box>
          {
            newComponentDefinition?.templates?.actions?.map(actionTemplate => {
              const checkbox = (<FormGroup key={ actionTemplate.name }>
                <FormControlLabel label={ `Generate action: ${ actionTemplate.name }` }
                                  control={ <Checkbox key={ actionTemplate.name } onClick={ (e) => {
                                    if (newComponentTemplates.includes(actionTemplate)) {
                                      setNewComponentTemplates(newComponentTemplates.filter(t => t !== actionTemplate));
                                    } else {
                                      setNewComponentTemplates(newComponentTemplates.concat(actionTemplate));
                                    }
                                  } } checked={ isTemplateAvailable(actionTemplate.name) }/> }/>
              </FormGroup>);

              if (actionTemplate.description) {
                return (<Tooltip title={ actionTemplate.description } key={ actionTemplate.name }>
                  { checkbox }
                </Tooltip>)
              } else {
                return checkbox;
              }
            }) ?? null
          }
        </Box>

        <Divider/>
        <Box>
          {
            newComponentDefinition?.templates?.commands?.map(commandTemplate => {
              const checkbox = (<FormGroup key={ commandTemplate.name }>
                <FormControlLabel label={ `Generate command: ${ commandTemplate.name }` }
                                  control={ <Checkbox key={ commandTemplate.name } onClick={ (e) => {
                                    if (newComponentTemplates.includes(commandTemplate)) {
                                      setNewComponentTemplates(newComponentTemplates.filter(t => t !== commandTemplate));
                                    } else {
                                      setNewComponentTemplates(newComponentTemplates.concat(commandTemplate));
                                    }
                                  } } checked={ isTemplateAvailable(commandTemplate.name) }/> }/>
              </FormGroup>);

              if (commandTemplate.description) {
                return (<Tooltip title={ commandTemplate.description } key={ commandTemplate.name }>
                  { checkbox }
                </Tooltip>)
              } else {
                return checkbox;
              }
            }) ?? null
          }
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={ onCancel }>
          Cancel
        </Button>
        <Button onClick={ () => {
          if (newComponentName && newComponentDefinition && newComponentProperties) {
            if (editedComponent) {
              // Edit the existing component in-place
              editedComponent.name = newComponentName;
              editedComponent.definition = newComponentDefinition;
              editedComponent.properties = newComponentProperties;
              onChange(editedComponent, []);
            } else {
              const newComponent = new SubsystemComponent(newComponentName, newComponentDefinition, newComponentProperties);
              console.debug('Created new', componentType, 'component:', newComponent);
              onChange(newComponent, newComponentTemplates);
            }
          } else {
            console.debug('Not enough information provided, not creating a component');
            onCancel();
          }
        } }>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function buildActionFromTemplate(template: ActionTemplate, component: SubsystemComponent, subsystem: Subsystem): SubsystemAction | null {
  console.debug('[BUILD-ACTION-FROM-TEMPLATE]', template, component, subsystem);
  const name = template.name;

  if (subsystem.actions.find(a => a.name === name)) {
    // TODO: Maybe rename the action instead of quitting
    console.debug(`[BUILD-ACTION-FROM-TEMPLATE] An action already exists with name "${ name }", skipping...`);
    return null;
  }

  const action = new SubsystemAction(name, subsystem.uuid);

  const params = template.params.map(paramTemplate => {
    const param = Param.create(paramTemplate.name, paramTemplate.type);
    return param;
  });

  if (params.find(p => !p)) {
    // At least one param couldn't be generated
    return null;
  }

  const steps = template.steps.map(stepTemplate => {
    switch (stepTemplate.type) {
      case "method-call":
        let targetComponent;
        if (stepTemplate.target === '$self') {
          targetComponent = component.uuid;
        } else {
          // Unsupported
          return null;
        }

        return new SubsystemActionStep({
          component: targetComponent,
          methodName: stepTemplate.methodName,
          params: stepTemplate.params
        });
      default:
        // Unsupported
        return null;
    }
  });

  if (steps.find(s => !s)) {
    // At least one step couldn't be generated
    return null;
  }

  action.params = params;
  action.steps = steps;

  return action;
}

function buildCommandFromTemplate(
  template: CommandTemplate,
  component: SubsystemComponent,
  subsystem: Subsystem,
  availableStates: SubsystemState[],
  availableActions: SubsystemAction[]
): AtomicCommand | null {
  console.debug('[BUILD-COMMAND-FROM-TEMPLATE]', template, component, subsystem, availableStates, availableActions);
  const name = template.name;

  if (subsystem.commands.find(c => c.name === name)) {
    // TODO: Maybe rename the command instead of quitting
    console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] A command already exists with name "${ name }", skipping...`);
    return null;
  }

  const commandParams: ActionParamCallOption[] = [];
  const initActions: SubsystemAction[] = [];
  let executeAction: SubsystemAction = null;

  template.toInitialize.forEach(ait => {
    const action = availableActions.find(a => a.name === ait.actionName);
    if (!action) {
      // didn't generate this action, bail
      console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] Could not find the initialize action "${ ait.actionName }", skipping...`);
      initActions.push(null);
      return;
    }
    const params = ait.params.map(pt => {
      const param = action.params.find(p => p.name === pt.paramName);
      if (!param) {
        console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] Could not find param "${ pt.paramName }" on action "${ action.name }", skipping...`);
        return null;
      }
      return new ActionParamCallOption(action, param, pt.invocationType, pt.hardcodedValue);
    });

    commandParams.push(...params);

    initActions.push(action);
  });

  if (initActions.length > 0 && initActions.find(a => !a)) {
    // Couldn't define a call to at least one initialize action
    console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] At least one initialize action couldn't be found, skipping...`);
    return null;
  }

  executeAction = availableActions.find(a => a.name === template.toExecute.actionName);
  if (!executeAction) {
    console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] Could not find the execute action "${ template.toExecute.actionName }", skipping...`);
    return null;
  }

  const executeParams = template.toExecute.params.map(pt => {
    const param = executeAction.params.find(p => p.name === pt.paramName);
    if (!param) {
      console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] Could not find param "${ pt.paramName }" on action "${ executeAction.name }", skipping...`);
      return null;
    }
    return new ActionParamCallOption(executeAction, param, pt.invocationType, pt.hardcodedValue);
  });

  commandParams.push(...executeParams);

  if (commandParams.length > 0 && commandParams.find(p => !p)) {
    // at least one param couldn't be defined, bail
    console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] At least one command param couldn't be found, skipping...`, commandParams);
    return null;
  }

  let endCondition;
  switch (template.endCondition) {
    case "once":
    case "forever":
      endCondition = template.endCondition;
      break;
    default:
      // assume a state name
      const state = availableStates.find(s => s.name === template.endCondition);
      if (!state) {
        // no available state with that name, bail
        console.debug(`[BUILD-COMMAND-FROM-TEMPLATE] End state "${ template.endCondition }" could not be found, skipping...`);
        return null;
      }
      endCondition = state.uuid;
      break;
  }

  const command = new AtomicCommand();
  command.subsystem = subsystem.uuid;
  command.name = name;

  command.params = commandParams;
  command.toInitialize = initActions.map(a => a.uuid);
  command.action = executeAction.uuid;
  command.endCondition = endCondition;
  return command;
}