import { Command, Subsystem } from "../../bindings/Command";
import { Controller } from "../../bindings/Controller";
import { Project } from "../../bindings/Project";
import { commandMethod } from "./CommandGroupGenerator";
import { className, indent, methodName, prettify } from "./util";

export function generateRobotClass(project: Project): string {
  return prettify(
    `
    package frc.robot;

    import edu.wpi.first.epilogue.Logged;
    import edu.wpi.first.wpilibj.TimedRobot;
    import edu.wpi.first.wpilibj2.command.Command;
    import edu.wpi.first.wpilibj2.command.CommandScheduler;
    import frc.robot.subsystems.*;

    @Logged
    public class Robot extends TimedRobot {
${
  project.subsystems.map(s => generateSubsystemDeclaration(s)).join("\n")
}

${
  project.controllers.map(c => `
    @NotLogged // Controllers are not loggable
    private final ${c.className} ${methodName(c.name)} = new ${c.className}(${c.port});
    `)
}

      public Robot() {
        configureButtonBindings();
        configureAutomaticBindings();

        Epilogue.configure(config -> {
          // TODO: Add a UI for customizing epilogue

          if (isRio1()) {
            // Only log to networktables on a roboRIO 1 because of limited disk space.
            // If the disk fills up, there's a real risk of getting locked out of the rio!
            config.dataLogger = new NTDataLogger(NetworkTablesInstance.getDefault());
          } else {
            // On a roboRIO 2 there's enough disk space to be able to safely log to disk
            config.dataLogger = new FileSystemLogger(DataLogManager.getDataLog());
          }
        });
      }

      @Override
      public void robotPeriodic() {
        // Run our commands
        CommandScheduler.getInstance().run();

        // Update our data logs
        Epilogue.update(this);
      }

      @Override
      public void autonomousInit() {
      }

      @Override
      public void teleopInit() {
      }

      @Override
      public void testInit() {
        CommandScheduler.getInstance().cancelAll();
      }

      /**
       * Sets up our command-to-button bindings. These bindings will be available in all modes; however,
       * keep in mind that joystick info is not sent to the robot during autonomous mode.
       */
      private void configureButtonBindings() {
${
  project.controllers.flatMap(c => generateButtonBindings(project, c)).join("\n")
}
      }

      /**
       * Configures bindings that will trigger commands to run automatically when certain conditions are met.
       */
      private void configureAutomaticBindings() {
        // TODO: Add a UI for binding commands to arbitrary triggers
      }

${
  project.commands.map(c => commandMethod(c.name, c, project)).join("\n")
}
    }
    `
  );
}

function generateSubsystemDeclaration(subsystem: Subsystem): string {
  return indent(
    `
      @Logged(name = "${subsystem.name}")
      private final ${className(subsystem.name)} ${methodName(subsystem.name)} = new ${className(subsystem.name)}();
    `.trim(),
    2
  );
}

function generateButtonBindings(project: Project, controller: Controller): string[] {
  return controller.buttons.flatMap(button => {
    const buttonName = button.name;
    const commands = [];

    const [whenPressedOwner, whenPressed] = findCommand(project, button.whenPressed)
    if (whenPressed) {
      const scope = whenPressedOwner === project ? 'this' : methodName((whenPressedOwner as Subsystem).name)
      commands.push(`${methodName(controller.name)}.${buttonName}().onTrue(${scope}.${methodName(whenPressed.name)}());`)
    }

    const [whenReleasedOwner, whenReleased] = findCommand(project, button.whenReleased)
    if (whenReleased) {
      const scope = whenReleasedOwner === project ? 'this' : methodName((whenReleasedOwner as Subsystem).name)
      commands.push(`${methodName(controller.name)}.${buttonName}().onFalse(${scope}.${methodName(whenReleased.name)}());`)
    }

    const [whileHeldOwner, whileHeld] = findCommand(project, button.whileHeld)
    if (whileHeld) {
      const scope = whileHeldOwner === project ? 'this' : methodName((whileHeldOwner as Subsystem).name)
      commands.push(`${methodName(controller.name)}.${buttonName}().whileTrue(${scope}.${methodName(whileHeld.name)}());`)
    }

    const [whileReleasedOwner, whileReleased] = findCommand(project, button.whileReleased)
    if (whileReleased) {
      const scope = whileReleasedOwner === project ? 'this' : methodName((whileReleasedOwner as Subsystem).name)
      commands.push(`${methodName(controller.name)}.${buttonName}().whileFalse(${scope}.${methodName(whileReleased.name)}());`)
    }

    const [toggleOnPressOwner, toggleOnPress] = findCommand(project, button.toggleOnPress)
    if (toggleOnPress) {
      const scope = toggleOnPressOwner === project ? 'this' : methodName((toggleOnPressOwner as Subsystem).name)
      commands.push(`${methodName(controller.name)}.${buttonName}().toggleOnTrue(${scope}.${methodName(toggleOnPress.name)}());`)
    }

    const [toggleOnReleaseOwner, toggleOnRelease] = findCommand(project, button.toggleOnRelease)
    if (toggleOnRelease) {
      const scope = toggleOnReleaseOwner === project ? 'this' : methodName((toggleOnReleaseOwner as Subsystem).name)
      commands.push(`${methodName(controller.name)}.${buttonName}().toggleOnFalse(${scope}.${methodName(toggleOnRelease.name)}());`)
    }

    return commands;
  })
}

function findCommand(project: Project, commandUUID: string): [Project | Subsystem, Command] | [] {
  if (commandUUID === null) {
    return []
  }

  let cmd = null

  // First, scan the project for globally-defined commands (eg command groups)
  if (cmd = project.commands.find(c => c.uuid === commandUUID)) {
    return [project, cmd]
  }

  // Then fall back to the 
  for (const subsystem of project.subsystems) {
    if (cmd = subsystem.commands.find(c => c.uuid === commandUUID)) {
      return [subsystem, cmd]
    }
  }

  return []
}
