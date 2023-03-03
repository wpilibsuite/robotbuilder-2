import { ReactNode } from "react";

export type ButtonConfig = {
  /**
   * The name of the button.
   */
  name: string;

  index: number;

  node?: ReactNode;
  /**
   * The X and Y coordinates of the center of the node on the image.  These should be in raw pixel values.
   */
  nodePos: number[];
}

export type ControllerConfig = {
  /**
   * The name of the controller
   */
  name: string;

  /**
   * The path to the controller image
   */
  imagePath: string;

  /**
   * The buttons available for configuration on the controller.
   */
  buttons: ButtonConfig[];
}

