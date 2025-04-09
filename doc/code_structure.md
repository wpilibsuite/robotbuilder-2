# Code Structure

_Note: All code currently in this project should be treated as a proof of concept. Changes, refactoring, and complete rewrites are expected to happen_

## Data Model

The robotbuilder data models live in `src/bindings/` (the directory name is a holdover from when the project was originally just a UI for binding commands to joystick buttons, and was never updated).

`Project.ts` contains definitions for the top-level project, which contains all subsystems, command groups, generated files, and project-level configuration settings; it also has definitions for miscellaneous project-related things like settings types and project-level codegen. Subsystem-level commands are owned by their subsystem, not the project.

`Configuration.ts` is dead code.

`Controller.ts` has type definitions for controllers and controller buttons, which are used by the button bindings panel to configure command triggers. No codegen currently exists to support reading raw joystick values; it's currently impossible to create a "drive with joysticks" command in robotbuilder.

`Command.ts` and `ir.ts` both contain definitions for actions, commands, and command groups (see `../logical_structure.md` for more details), as well as for the various kinds of parameters and arguments that can be passed through from commands to the actions or wrapped commands they use. Much of the code in these files is for dealing with parameters; generally speaking, any _action_ that accepts an argument (for example, a target motor voltage) needs to have a value defined for that argument, which can either be a hardcoded value (as arbitrary text input from the user), or bubble up to the arguments list of the command, and be defined either as the same type as the original argument or as a supplier.

For example:

```java
// Given an action that accepts an argument...
void someAction(double volts) { ... }

// It can have its value harcoded
Command someCommand() {
  return run(() -> someAction(<hardcoded number>)
}

// Or passed through as a fixed number when the command is created (good for known subsystem setpoints)
Command someCommand(double volts) {
  return run(() -> someAction(volts))
}

// Or passed through as a callback that can be invoked at runtime (good for dynamic behavior like joystick control)
Command someCommand(DoubleSupplier volts) {
  return run(() -> someAction(volts.getAsDouble())
}
```

These files are by far the messiest of the data models and could use cleaning up.

All data objects in a project (subsystems, commands, parameter definitions, controllers, buttons, etc) are given UUIDs to act as identifiers that can be looked up within a project. This was added to make serde easier - no need to deal with dozens of unique copies of the same object from a `JSON.parse` or `JSON.stringify` call - but it certainly makes working with it in the UI and code generators more of a pain. The UUID setup is a good candidate for a rewrite; make serde gracefully handle duplicate references to the same objects, and make the codebase just use normal object references instead of UUID lookups everywhere.

## Code Generation

Codegen logic lives in `src/codegen`. File templates for things like gitignore and build.gradle files are in `src/bundled_files`. Miscellaneous utility functions like Java formatters and string formatters live in `util.ts`. Generators for subsystem actions live in `ActionGenerator.ts`; single-subsystem commands in `CommandGenerator.ts`; parallel and sequential command groups in `CommandGroupGenerator.ts`; Robot.java generation in `RobotGenerator.ts`; subsystem states in `StateGenerator.ts`; and subsystem class generation in `SubsystemGenerator.ts` (which delegates most work to action, command, and state codegen).

## Components

`src/components/ComponentDefinition.ts` defines types for what a component can provide. (Components are things like sensors, actuators, and controls.) Component definitions are used to define the lowest level APIs available to robotbuilder, which can be used by the UI to provide options to users for what kinds of components can be added to a subsystem and what functions are available to be used by actions (including name, return type, and argument lists).

## UI

All UI code is written in React, mostly because it's the predominant JS UI framework that should have staying power and enough examples/tutorials/documentation to make it more likely for contributors to come in already with experience with the framework, or to at least be able to learn it quickly enough. Other frameworks like Vue were considered, and could be switched to if there's enough staying power.  We don't want to use a flash-in-the-pan framework and be stuck on a dead technology stack (RIP all WPILib Java desktop apps).

The UI is a mess of React code that was only focused on a functioning proof of concept app. All UI-related code is in `src/ui`; `src/ui/subsystem/Subsystem.tsx` is an absolute ball of mud. Rip it out and rewrite it all, and split it out into separate files instead of this 1500-line apocalypse.
