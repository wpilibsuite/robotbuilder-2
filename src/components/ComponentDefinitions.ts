import { ComponentDefinition } from "./ComponentDefinition";

export class ComponentDefinitions {
  definitions: ComponentDefinition[] = [];

  public addDefinition(definition: ComponentDefinition) {
    if (this.definitions.find(d => d.id === definition.id)) {
      console.warn("WARNING! A definition already exists with id", definition.id, "! The existing definition will be replaced with the new one");
      // const existingDefinition = this.definitions.find(d => d.id === definition.id);
      // this.definitions.splice(this.definitions.indexOf(existingDefinition), 1, definition);
      this.definitions = this.definitions.filter(d => d.id !== definition.id).concat(definition);
    } else {
      this.definitions.push(definition);
    }
  }

  public forId(id: string): ComponentDefinition {
    return this.definitions.find(d => d.id === id);
  }
}

export const COMPONENT_DEFINITIONS = new ComponentDefinitions();
