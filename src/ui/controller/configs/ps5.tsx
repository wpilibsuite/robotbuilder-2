import { ControllerConfig } from "../ControllerConfig";

const rightButtonNode = (
  <div style={{
    borderColor: "rgba(255, 0, 0, 1)",
    borderWidth: 4,
    borderStyle: "solid",
    backgroundColor: "rgba(71,81,255,0.08)",
    borderRadius: 32,
    width: 32,
    height: 32
  }}/>
);

const buttonNode = (
  <svg viewBox={ "0 0 16 16" } width="16" height="16" xmlns="http://www.w3.org/2000/svg" className={"button-node"}>
    <circle cx="8" cy="8" r="8"/>
  </svg>
);

export const PS5Controller: ControllerConfig = {
  name: 'PS5',
  imagePath: '/controllers/ps5.png',
  buttons: [
    {
      name: "TRIANGLE",
      index: 1,
      nodePos: [1948 + 32, 365 + 32],
      node: buttonNode
    },
    {
      name: "CIRCLE",
      index: 2,
      nodePos: [2112 + 32, 532 + 32],
      node: buttonNode
    },
    {
      name: "SQUARE",
      index: 3,
      nodePos: [1785 + 32, 532 + 32],
      node: buttonNode
    },
    {
      name: "X",
      index: 4,
      nodePos: [1948 + 32, 698 + 32],
      node: buttonNode
    },

    // {name: "D-PAD UP", nodePos: [170, 410]},
    // {name: "D-PAD RIGHT", nodePos: []},
    // {name: "D-PAD DOWN", nodePos: []},
    // {name: "D-PAD LEFT", nodePos: []},
    //
    // {name: "LEFT JOYSTICK", nodePos: []},
    // {name: "RIGHT JOYSTICK", nodePos: []},
    //
    // {name: "LEFT BUMPER", nodePos: []},
    // {name: "LEFT TRIGGER", nodePos: []},
    //
    // {name: "RIGHT BUMPER", nodePos: []},
    // {name: "RIGHT TRIGGER", nodePos: []},
  ]
}