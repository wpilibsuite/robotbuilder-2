import React, { useEffect, useState } from "react"
import { Subsystem, SubsystemComponent } from "../../bindings/Command"
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Button, Input, MenuItem, Select, Switch, TextField } from "@mui/material"
import { Property } from "../../components/ComponentDefinition"
import { HelpableLabel } from "../HelpableLabel"

type SharedProps = {
  subsystem: Subsystem
  onChange: (component: SubsystemComponent) => void
  onDelete: (component: SubsystemComponent) => void
}

type ComponentColumnProps = SharedProps & {
  components: SubsystemComponent[];
}

export function ComponentColumn(props: ComponentColumnProps) {
  return (
    <div className="component-column">
      {
        props.components.length > 0 ?
          props.components.map(component => {
            return <ComponentPanel key={ component.uuid } component={ component } { ...props }/>
          })
          : <div style={{ textTransform: "uppercase", padding: "8px", alignContent: "center", justifyContent:"center", display: "flex", width: "100%" }}>Nothing here</div>
      }
    </div>
  )
}

type ComponentPanelProps = SharedProps & {
  component: SubsystemComponent
  subsystem: Subsystem
}

function ComponentPanel(props: ComponentPanelProps) {
  const component = props.component
  const [name, setName] = useState(component.name)

  const updateName = (newName: string) => {
    setName(newName)
    component.name = newName
    props.onChange(component)
  }

  return (
    <div className="component-panel">
      <Accordion square>
        <AccordionSummary className="component-accordion-summary">
          <div className="component-panel-header">
            <span>{ name }</span>
            <span style={{ fontWeight: "initial" }}>
              <HelpableLabel description={ component.definition.description }>
                { component.definition.name }
              </HelpableLabel>
            </span>
          </div>
        </AccordionSummary>
        <AccordionDetails className="component-accordion-details">
          <div className="component-panel-config" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "36px", marginBottom: "8px" }}>
            <HelpableLabel description={ `The name of the component. This may appear differently in code due to limitations around punctuation and whitespace in Java identifiers.` }>
              Name
            </HelpableLabel>
            <TextField value={ name }
                       onChange={ (e) => updateName(e.target.value) }
                       variant="standard"/>
          </div>
          <div className="component-panel-properties">
            {
              component.definition.properties.map(property => {
                return <PropertyEditor key={ property.name } property={ property } component={ component } { ...props }/>
              })
            }
          </div>
          <div className="component-panel-footer">
            <Button onClick={ () => props.onDelete(component) }>
              Delete
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

type PropertyEditorProps = SharedProps & {
  property: Property
  component: SubsystemComponent
}

function PropertyEditor(props: PropertyEditorProps) {
  const component = props.component
  const property = props.property
  const subsystem = props.subsystem

  const [value, setValue] = useState(component.properties[property.codeName])
  useEffect(() => setValue(component.properties[property.codeName]), [property, component])

  const updateValue = (newValue: string | string[] | boolean | number) => {
    setValue(newValue)
    component.properties[property.codeName] = newValue
    props.onChange(component)
  }

  return (
    <div className="property-editor">
      <HelpableLabel description={ property.description } >
        { property.name }
      </HelpableLabel>
      {
        (
          () => {
            switch (property.type) {
              case "int":
              case "long":
              case "double":
                return <Input type="number" value={ value } onChange={ (e) => updateValue(e.target.value) }/>
              case "boolean":
                return <Switch value={ value } onChange={ (e) => updateValue(e.target.checked) }/>
            }

            if (property.type.startsWith("vararg")) {
              // assume variadic components because variadic primitives is odd
              // components is also easy to implement with a multiple-select dropdown
              const type = property.type.split("vararg ")[1]
              console.log(type)
              switch (type) {
                case "boolean":
                case "int":
                case "long":
                case "double":
                case "string":
                  return (<span>Vararg primitive types not yet supported</span>)
              }

              return (
                <Autocomplete multiple
                              size="small"
                              limitTags={ 4 }
                              onChange={ (event, newValue: SubsystemComponent[]) => {
                                updateValue(newValue.map(component => component.uuid))
                              } }
                              options={ subsystem.components.filter(c => c.definition.wpilibApiTypes.find(t => t === type)) }
                              value={ subsystem.components.filter(c => value && value.includes(c.uuid)) }
                              getOptionLabel={ (option) => option.name }
                              renderInput={ (params) => (<TextField { ...params }/>) }
                />
              )
            }
            if (property.options?.length > 0) {
              return (
                <Select value={ value } variant="standard" onChange={ (e) => updateValue(e.target.value) }>
                  {
                    property.options.map((option) => {
                      return (
                        <MenuItem key={ option.codeName } value={ option.codeName }>
                          { option.name }
                        </MenuItem>
                      )
                    })
                  }
                </Select>
              )
            }
            return (<span>Cannot edit a { property.type }!</span>)
          }
        )()
      }
    </div>
  )
}
