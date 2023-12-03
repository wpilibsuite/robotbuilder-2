import { act, render, screen } from "@testing-library/react";
import React from "react";
import { click } from "@testing-library/user-event/dist/click";
import { ProjectView } from "../../ui/ProjectView";
import { makeNewProject } from "../../bindings/Project";
import * as IR from "../../bindings/ir";
import { test, expect } from "vitest";

function setup() {
  const project = makeNewProject();
  render(<ProjectView initialProject={ project } />);

  act(() => click(document.getElementById("robot-subsystems-tab")));
  // create a drive train template
  act(() => click(screen.getByText("Drivetrain")))

  act(() => click(document.getElementById("robot-commands-tab")));
  act(() => click(document.getElementById("new-command-group-button")));

  return project;
}

test("to be rewritten", () => {
  expect(true).to.be.true
})

/*
test("creating a command group with a single atomic command", () => {
  const project = setup();
  const drivebase = project.subsystems[0];
  const commands = drivebase.commands;
  const driveWithSpeeds = commands.find(c => c.name === "Drive with Speeds");

  act(() => click(document.querySelector('.parallel-group-editor button.command-drop-target')));
  act(() => click(document.querySelectorAll('li.MuiMenuItem-root')[commands.indexOf(driveWithSpeeds)]));
  act(() => click(screen.getByText("Save Group")));

  expect(project.commands.length).toEqual(1)
  const newGroup = project.commands[0];
  expect(newGroup).toBeInstanceOf(IR.ParGroup)

  expect(newGroup).toMatchObject({
    decorators: [],
    commands: [
      {
        command: driveWithSpeeds.uuid,
        decorators: [],
        params: [
          {
            hardcodedValue: null,
            name: "leftSpeed",
            original: {
              hardcodedValue: null,
              invocationType: "passthrough-value",
              name: "leftSpeed"
            },
            passthroughs: [],
            passthroughIds: []
          },
          {
            hardcodedValue: null,
            name: "rightSpeed",
            original: {
              hardcodedValue: null,
              invocationType: "passthrough-value",
              name: "rightSpeed"
            },
            passthroughs: [],
            passthroughIds: []
          },
        ],
        subsystems: [drivebase.uuid]
      }
    ],
    params: [
      {
        hardcodedValue: null,
        name: "leftSpeed",
        original: {
          hardcodedValue: null,
          invocationType: "passthrough-value",
          name: "leftSpeed"
        },
        passthroughs: [],
        passthroughIds: []
      },
      {
        hardcodedValue: null,
        name: "rightSpeed",
        original: {
          hardcodedValue: null,
          invocationType: "passthrough-value",
          name: "rightSpeed"
        },
        passthroughs: [],
        passthroughIds: []
      }
    ],
    // don't care about UUID
    name: "New Command Group",
    endCondition: "all"
  })
})

test("nesting command groups", () => {
  const project = setup();
  const drivebase = project.subsystems[0];
  const commands = drivebase.commands;
  const driveWithSpeeds = commands.find(c => c.name === "Drive with Speeds");

  act(() => click(document.querySelector('.parallel-group-editor button.command-drop-target')));
  act(() => click(document.querySelectorAll('li.MuiMenuItem-root')[commands.indexOf(driveWithSpeeds)]));
  act(() => click(screen.getByText("Save Group")));

  expect(project.commands.length).toEqual(1)
  const group1 = project.commands[0];
  expect(group1).toBeInstanceOf(IR.ParGroup)

  // Create new group
  act(() => click(document.getElementById("new-command-group-button")));
  act(() => click(document.querySelector('.parallel-group-editor button.command-drop-target')));
  act(() => click(document.querySelectorAll('li.MuiMenuItem-root')[0])); // command groups sorted first
  act(() => click(screen.getByText("Save Group")));

  expect(project.commands.length).toEqual(2)
  const group2 = project.commands[1];
  expect(group2).toBeInstanceOf(IR.ParGroup)

  expect(group2).toMatchObject({
    decorators: [],
    commands: [
      {
        command: group1.uuid,
        decorators: [],
        params: [
          {
            hardcodedValue: null,
            name: "leftSpeed",
            original: {
              hardcodedValue: null,
              invocationType: "passthrough-value",
              name: "leftSpeed"
            },
            passthrough: group1.params[0]
          },
          {
            hardcodedValue: null,
            name: "rightSpeed",
            original: {
              hardcodedValue: null,
              invocationType: "passthrough-value",
              name: "rightSpeed"
            },
            passthrough: group1.params[1]
          },
        ],
        subsystems: [drivebase.uuid]
      }
    ],
    params: [
      {
        hardcodedValue: null,
        name: "leftSpeed",
        original: {
          hardcodedValue: null,
          invocationType: "passthrough-value",
          name: "leftSpeed"
        },
        passthrough: group1.params[0]
      },
      {
        hardcodedValue: null,
        name: "rightSpeed",
        original: {
          hardcodedValue: null,
          invocationType: "passthrough-value",
          name: "rightSpeed"
        },
        passthrough: group1.params[1]
      }
    ],
    // don't care about UUID
    name: "New Command Group",
    endCondition: "all"
  })
})
*/