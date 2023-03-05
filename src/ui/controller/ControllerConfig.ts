import { ReactNode } from "react";

export type ButtonConfig = {
  /**
   * The name of the button.
   */
  name: string;

  index: number;
}

export type ControllerConfig = {
  /**
   * The name of the controller
   */
  name: string;

  /**
   * The SVG component to render.
   */
  svg: ReactNode;

  /**
   * The buttons available for configuration on the controller.
   */
  buttons: ButtonConfig[];
}

