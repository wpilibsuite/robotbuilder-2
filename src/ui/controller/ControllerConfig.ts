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
   * The path to the SVG file to render as the controller.
   */
  svg: string;

  /**
   * The buttons available for configuration on the controller.
   */
  buttons: ButtonConfig[];
}

