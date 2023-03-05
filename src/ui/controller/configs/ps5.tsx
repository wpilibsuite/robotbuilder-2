import { ControllerConfig } from "../ControllerConfig";
import { ReactSVG } from "react-svg";

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
  svg: <ReactSVG src={"/controllers/ps5.svg"}/>,
  buttons: [
    {
      name: "TRIANGLE",
      index: 1
    },
    {
      name: "CIRCLE",
      index: 2
    },
    {
      name: "SQUARE",
      index: 3
    },
    {
      name: "X",
      index: 4
    },
    {
      name: "D-PAD UP",
      index: 5
    },
    {
      name: "D-PAD RIGHT",
      index: 6
    },
    {
      name: "D-PAD DOWN",
      index: 7
    },
    {
      name: "D-PAD LEFT",
      index: 8
    }
  ]
}