type CommandReference = string;

export type Controller = {
  /**
   * The name of the controller, e.g. "Driver" or "Operator".
   */
  name: string;

  uuid: string;

  /**
   * The type of the controller, e.g. "Playstation 5" or "Flightmaster".
   */
  type: string;

  /**
   * The buttons available on the controller
   */
  buttons: ControllerButton[];
}

export type ControllerButton = {
  /**
   * The name of the button, eg "A" or "X".
   */
  name: string;

  /**
   * The command to execute when this button is pressed.
   */
  whenPressed?: CommandReference;

  /**
   * The command to execute when this button is released.
   */
  whenReleased?: CommandReference;

  /**
   * The command to execute as long as this button is pressed.  Releasing the button will cancel the command.
   */
  whileHeld?: CommandReference;

  /**
   * The command to run as long as this button is released.  Pressing the button will cancel the command.
   */
  whileReleased?: CommandReference;

  /**
   * The command to toggle when pressing this button. Pressing once will start, pressing twice will cancel.
   */
  toggleOnPress?: CommandReference;

  /**
   * The command to toggle when releasing this button. Releasing once will start, releasing twice will cancel.
   */
  toggleOnRelease?: CommandReference;
}
