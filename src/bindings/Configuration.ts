import { Controller } from "./Controller"
import { Command, Subsystem } from "./Command"

export type Configuration = {
  name: string;
  controllers: Controller[];
  subsystems: Subsystem[];
  commands: Command[];
}
