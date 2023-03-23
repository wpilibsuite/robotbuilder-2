import { Subsystem, SubsystemComponent } from "../../bindings/Command";
import React, { useState } from "react";
import { ComponentDefinition, ComponentType, MethodDefinition } from "../../components/ComponentDefinition";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle,
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

  const [newComponentDefinition, setNewComponentDefinition] = useState(null as ComponentDefinition);
  const [newComponentName, setNewComponentName] = useState(null);
  const [newComponentProperties, setNewComponentProperties] = useState(null);
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
                  setNewComponentDefinition(component.definition);
                  setNewComponentName(component.name);
                  setNewComponentProperties({ ...component.properties });
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
          setNewComponentName(null);
          setNewComponentDefinition(null);
          setNewComponentProperties(null);
          setShowNewComponentDialog(true);
        } }>
          + Add { componentType }
        </Button>
      </Box>

      <Dialog open={ showNewComponentDialog }>
        <DialogTitle>
          Add New { componentType }
        </DialogTitle>
        <DialogContent>
          <Box style={ { display: "grid", gridTemplateColumns: "150px minmax(200px, 1fr)" } }>
            <label>Name</label>
            <TextField onChange={ (e) => setNewComponentName(e.target.value) } defaultValue={ newComponentName ?? '' } variant="standard"/>

            <label>Choose a type</label>
            <Select onChange={ (e) => {
              setNewComponentDefinition(COMPONENT_DEFINITIONS.forId(e.target.value));
              setNewComponentProperties({}); // clear any saved properties from the previous selection
            } } defaultValue={ newComponentDefinition?.id ?? '' }
                    variant="standard">
              { COMPONENT_DEFINITIONS.definitions.filter(d => d.type === componentType).map(definition => {
                return (
                  <MenuItem value={ definition.id } key={ definition.id }>
                    { definition.name }
                  </MenuItem>
                )
              }) }
            </Select>

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
                            return <Input type="number" key={ `prop-input-${ prop.name }` } defaultValue={ newComponentProperties[prop.codeName] ?? '' } onChange={ (e) => {
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
                                              defaultValue={ subsystem.components.filter(c => newComponentProperties[prop.codeName].includes(c.uuid)) }
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
                                <Select key={ `select-${ prop.name }` }
                                        variant="standard"
                                        onChange={ (e) => {
                                  const props = { ...newComponentProperties };
                                  props[prop.codeName] = e.target.value;
                                  setNewComponentProperties(props);
                                } }
                                defaultValue={ newComponentProperties[prop.codeName] ?? '' }>
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
          <Button onClick={ () => setShowNewComponentDialog(false) }>
            Cancel
          </Button>
          <Button onClick={ () => {
            if (newComponentName && newComponentDefinition && newComponentProperties) {
              if (editedComponent) {
                // Edit the existing component in-place
                editedComponent.name = newComponentName;
                editedComponent.definition = newComponentDefinition;
                editedComponent.properties = newComponentProperties;
                onChange([...components]);
              } else {
                const newComponent = new SubsystemComponent(newComponentName, newComponentDefinition, newComponentProperties);
                console.debug('Created new', componentType, 'component:', newComponent);
                onChange(components.concat(newComponent));
              }
            } else {
              console.debug('Not enough information provided, not creating a component');
            }
            setShowNewComponentDialog(false);
          } }>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
