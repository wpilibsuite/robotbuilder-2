import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { click } from '@testing-library/user-event/dist/click';
import { ProjectView } from '../../ui/ProjectView';
import { makeNewProject } from '../../bindings/Project';
import * as IR from '../../bindings/ir';
import { test, expect } from 'vitest';

function setup() {
  const project = makeNewProject();
  render(<ProjectView initialProject={ project }/>);

  act(() => click(document.getElementById("robot-subsystems-tab")));
  act(() => click(document.getElementById("subsystem-button-drivetrain")));
  act(() => click(document.getElementById("robot-commands-tab")));
  act(() => click(document.getElementById("new-command-group-button")));

  return project;
}

const project = setup();
const drivebase = project.subsystems[0];
const commands = drivebase.commands;
const driveWithSpeeds = commands.find(c => c.name === "Drive with Speeds");

test('creating a command group with a single atomic command', () => {
  act(() => click(document.getElementById("add-command-button")));
  act(() => click(document.querySelectorAll('li.MuiMenuItem-root')[commands.indexOf(driveWithSpeeds)]));
  act(() => click(screen.getByText("Save Group")));

  expect(project.commands.length).toEqual(1);

  const newGroup = project.commands[0];
  expect(newGroup).toBeInstanceOf(IR.ParGroup);

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
              name: "leftSpeed",
            },
            passthroughIds: [],
            passthroughs: [],
          },
          {
            hardcodedValue: null,
            name: "rightSpeed",
            original: {
              hardcodedValue: null,
              invocationType: "passthrough-value",
              name: "rightSpeed",
            },
            passthroughIds: [],
            passthroughs: [],
          },
        ],
      },
    ],
    params: [
      {
        hardcodedValue: null,
        name: "leftSpeed",
        original: {
          hardcodedValue: null,
          invocationType: "passthrough-value",
          name: "leftSpeed",
        },
      },
      {
        hardcodedValue: null,
        name: "rightSpeed",
        original: {
          hardcodedValue: null,
          invocationType: "passthrough-value",
          name: "rightSpeed",
        },
      },
    ],
    name: "New Command Group",
    endCondition: "all",
  });
});

test("nesting command groups", () => {
  expect(project.commands.length).toEqual(1);
  const group1 = project.commands[0];
  expect(group1).toBeInstanceOf(IR.ParGroup);

  act(() => click(document.getElementById("new-command-group-button")));
  act(() => click(document.getElementById("add-command-button")));
  act(() => click(document.querySelectorAll('li.MuiMenuItem-root')[0]));
  act(() => click(screen.getByText("Save Group")));

  expect(project.commands.length).toEqual(2);
  const group2 = project.commands[1];
  expect(group2).toBeInstanceOf(IR.ParGroup);

  const matchesForGroup2 = [
    { target: group2.decorators, expected: [] },
    { 
      target: group2.commands[0], 
      expected: [
        { command: group1.uuid },
        { decorators: [] },
        { 
          params: [
            { 
              hardcodedValue: null,
              name: "leftSpeed",
              original: { 
                hardcodedValue: null,
                invocationType: "passthrough-value",
                name: "leftSpeed"
              }
            },
            { 
              hardcodedValue: null,
              name: "rightSpeed",
              original: { 
                hardcodedValue: null,
                invocationType: "passthrough-value",
                name: "rightSpeed"
              }
            }
          ]
        },
        { subsystems: [drivebase.uuid] }
      ]
    },
    { 
      target: group2.params[0], 
      expected: [
        { hardcodedValue: null },
        { name: "leftSpeed" },
        { original: { 
            hardcodedValue: null,
            invocationType: "passthrough-value",
            name: "leftSpeed"
          } 
        }
      ]
    },
    { 
      target: group2.params[1], 
      expected: [
        { hardcodedValue: null },
        { name: "rightSpeed" },
        { original: { 
            hardcodedValue: null,
            invocationType: "passthrough-value",
            name: "rightSpeed"
          } 
        }
      ]
    },
  ];
  
  matchesForGroup2.forEach(match => {
    match.expected.forEach(item => {
      if (Array.isArray(item)) {
        item.forEach(subItem => {
          expect(subItem.target).toEqual(subItem.expected);
        });
      } else {
        expect(item.target).toEqual(item.expected);
      }
    });
  });
});