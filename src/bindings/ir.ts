/*
 * This file contains definitions for intermediate representations of command groups and a DSL for constructing
 * the IR without needing to go through manually creating a bunch of new objects.
 *
 * const someGroup = sequence((s) => {
 *   s.parallel("all", (p) => {
 *     p.run("subsystemX", "commandA")
 *     p.run("subsystemY", "commandB")
 *   })
 *   s.runGlobal("some other command group")
 * })
 *
 * (note that references to subsystems and commands are by UUID, not by name, but those make for unreadable examples)
 */

import { v4 as uuidV4 } from "uuid"
import { ActionParamCallOption, AtomicCommand } from "./Command"

/**
 * Decorates a command by adding a maximum duration limit.  If the command hasn't naturally completed after the
 * given duration has elapsed, it will be forcibly interrupted.
 */
export type DurationDecorator = {
  duration: number;
  type: "duration";
}

// TODO: Support subsystem states and OI buttons
export type BooleanCondition = string;

/**
 * Decorates a command by specifying a particular end condition when the command should stop running
 */
export type UntilDecorator = {
  until: BooleanCondition;
  type: "until";
}

/**
 * Decorates a command by specifying a condition under which it should NOT run. The condition will be checked
 * at the time the command is initialized.
 */
export type UnlessDecorator = {
  unless: BooleanCondition;
  type: "unless";
}

/**
 * Repeats the command forever.
 * Note that if this is used, the resulting command will never naturally terminate and
 * should have a terminal decorator (e.g. forDuration(...) or until(...)) to prevent it
 * from running forever.
 */
export type RepeatDecorator = {
  type: "repeat";
}

export type Decorator =
  | DurationDecorator
  | UntilDecorator
  | UnlessDecorator
  | RepeatDecorator

class Decorable {
  /**
   * Command decorators.  Since each decorator returns a new command, decorators can be chained to create interesting
   * behavior such as loops, eg `command(...).repeatingForever().forNoLongerThan(10 [seconds])`
   *
   * Note that order matters a lot! `repeatForever().until(...)` will loop until the end condition is met, while
   * `until(...).repeatForever()` will run the original command until the end condition is met, then run /that/
   * combination in an infinite loop!
   */
  readonly decorators: Decorator[] = []

  /**
   * Adds a time limit to the command.  If the command ends before the time limit is reached, it will not restart.
   * If you want to run a command for a specific amount of time, either leave out the end condition in the original
   * command (i.e. have it run forever), or decorate it with a `repeatForever()` before adding a time limit.
   *
   * @param seconds the maximum allowable time the command should run for. Must be a positive number
   */
  forNoLongerThan(seconds: number) {
    // It would be nice to have a Rails-like `10.seconds` function to help denote units. Too bad
    if (seconds <= 0) {
      throw new Error(`Timeout must be a positive number, but was ${ seconds }`)
    }

    this.decorators.push({ duration: seconds, type: "duration" })
    return this
  }

  until(endCondition: BooleanCondition) {
    this.decorators.push({ until: endCondition, type: "until" })
    return this
  }

  unless(condition: BooleanCondition) {
    this.decorators.push({ unless: condition, type: "unless" })
    return this
  }

  repeatingForever() {
    this.decorators.push({ type: "repeat" })
    return this
  }
}

export type Invocation = CommandInvocation | Group;

/**
 * A placeholder for a parameter defined by the top-level command group and available to any command invocation
 * within the group, no matter how nested. These are automatically defined by the DSL by inspecting the parameters
 * on the top-level `sequential` or `parallel` call and extracting the names of those parameters in the order they
 * appear.
 */
export class ParamPlaceholder {
  readonly name: string

  readonly uuid: UUID = uuidV4()

  /**
   * The base param on the command this param actually passes down to
   */
  readonly original: ActionParamCallOption

  /**
   * The param(s) that this one is passed to within the command group.
   *
   * sequence((s, angle) => {
   *   s.run("arm", "to-angle", angle)
   * })
   *
   * the "angle" param on the "to-angle" command is pass through to the "angle" param on the sequence and is stored
   * there
   *
   * Do not write to this array! Use #addPassthrough or #removePassthrough
   */
  readonly passthroughs: ParamPlaceholder[] = []

  /**
   * The IDs of the passthrough params.  This is mostly used because checking for object equality inclusion in the
   * passthroughs array tends to fail, resulting in passthroughs not getting removed/being added multiple times
   * when they shouldn't be.
   */
  readonly passthroughIds: UUID[] = []

  /**
   * The hardcoded value for this placeholder.
   */
  hardcodedValue: string = null

  constructor(name: string, original: ActionParamCallOption, passthroughs: ParamPlaceholder[], hardcodedValue?: string) {
    this.name = name
    this.original = original
    this.hardcodedValue = hardcodedValue ?? null
    passthroughs.forEach(p => this.addPassthrough(p))
  }

  /**
   * Checks if this param should appear on a command factory method.
   */
  appearsOnFactory(): boolean {
    if (this.hardcodedValue) {
      // Has a hardcoded value on the invocation
      return false
    } else {
      // Not hardcoded, but not used by any invocations under the hood
      return this.passthroughs.length > 0
    }
  }

  addPassthrough(passthrough: ParamPlaceholder) {
    if (this.passthroughs.includes(passthrough) || this.passthroughIds.includes(passthrough.uuid)) {
      throw new Error(`Param "${ passthrough.name }"/${ passthrough.uuid } is already passed through!`)
    }

    this.passthroughs.push(passthrough)
    this.passthroughIds.push(passthrough.uuid)
  }

  removePassthrough(passthrough: ParamPlaceholder): boolean {
    if (!this.passesThroughTo(passthrough)) {
      return false
    }

    const index = this.passthroughIds.indexOf(passthrough.uuid)
    this.passthroughs.splice(index, 1)
    this.passthroughIds.splice(index, 1)
    return true
  }

  passesThroughTo(other: ParamPlaceholder): boolean {
    return this.passthroughs.includes(other) || this.passthroughIds.includes(other.uuid)
  }
}

export class CommandInvocation extends Decorable {
  /**
   * The subsystems that this command requires. Note that in the case of a single requirement, we assume the command
   * being invoked is defined by that subsystem. Commands with 0 or 2 or more subsystems are assumed to be defined
   * in the main robot class.
   */
  readonly subsystems: UUID[]

  /**
   * The UUID of the command being invoked.
   */
  readonly command: UUID

  /**
   * The params to pass to the command. These are assumed to match 1-1 with the declared arguments to the command
   * factory. These can either be the param placeholders defined at the top-level group, or be arbitrary hardcoded
   * values.
   */
  readonly params: ParamPlaceholder[] = []

  constructor(subsystems: UUID[], command: UUID, params: ParamPlaceholder[]) {
    super()
    this.subsystems = subsystems
    this.command = command
    this.params = params
  }

  static fromAtomicCommand(command: AtomicCommand): CommandInvocation {
    console.log("IR from atomic", command)
    return new CommandInvocation(
      [command.subsystem],
      command.uuid,
      command.params
        .filter(p => p.invocationType !== "hardcode")
        .map(p => new ParamPlaceholder(p.name, p, [], null)),
    )
  }

  requirements(): UUID[] {
    return this.subsystems
  }

  runsCommand(command: UUID): boolean {
    return command === this.command
  }
}

type UUID = string;

export class Group extends Decorable {
  /**
   * The commands that are part of this group. Commands can either be inlined groups (eg commandA().andThen(commandB()))
   * or be invocations of predefined commands defined in subsystems or the main robot class.
   */
  commands: Invocation[] = []

  /**
   * The parameters on the group's definition. These are not used for inlined groups, because any params they'd need
   * will be passed directly to the commands they invoke (instead of using the inlined group as an intermediary, which
   * would just be wasteful).
   */
  params: ParamPlaceholder[] = []

  uuid: UUID = uuidV4()

  /**
   * The name of the command group.  This is only used by top-level command groups; nested command groups are inlined
   * without names.
   */
  name: string

  readonly type: "Sequence" | "Parallel"

  /**
   * Adds a new sequential command group to this group.
   *
   * @example
   *  .sequence((s) => {
   *    s.run("subsystem", "command", 1, 2, 3)
   *  }).forNoLongerThan(10 [seconds])
   *
   * @param closure the closure to use to configure the new sequential group
   *
   * @return the sequential group
   */
  sequence(closure: (seq: SeqGroup) => void): SeqGroup {
    const seq = new SeqGroup()
    closure(seq)
    this.addCommand(seq)
    return seq
  }

  /**
   * Adds a new parallel command group to this group.
   *
   * @param endCondition the end condition for the parallel group
   * @param closure the closure to use to configure the new parallel group
   *
   * @return the parallel group
   */
  parallel(endCondition: ParallelEndCondition, closure: (par: ParGroup) => void): ParGroup {
    const par = new ParGroup(endCondition)
    closure(par)
    this.addCommand(par)
    return par
  }

  /**
   * Adds a call to a command defined elsewhere (such as a subsystem or in the main robot class) to this group.
   *
   * @example
   *  sequence((s, left, right) => {
   *    s.run("Drivebase", "Tank Drive", left, right, false) // leftSpeed, rightSpeed, squaredInputs
   *  })
   *
   * @param owner the owner of the command; or, the location where the command is defined
   * @param command the uuid of the command
   * @param params the parameters to pass to the command when called. These can be hardcoded values (e.g. "foo", "x", 1.123),
   * or can reference parameters defined in the top-level command group
   */
  run(owner: UUID, command: UUID, ...params): CommandInvocation {
    const invocation = new CommandInvocation([owner], command, params)
    this.addCommand(invocation)
    return invocation
  }

  /**
   * Adds a call to the command defined in the main robot class.  Shorthand for `run("[robot]", command, ...params)`
   *
   * @see #run
   */
  runGlobal(command: string, ...params): CommandInvocation {
    return this.run("[robot]", command, params)
  }

  requirements(): UUID[] {
    return [...new Set(this.commands.flatMap(c => c.requirements()))]
  }

  runsCommand(command: UUID): boolean {
    return command === this.uuid ||
      !!this.commands.find(c => c.runsCommand(command))
  }

  private addCommand(child: Invocation) {
    this.commands.push(child)
  }
}

export class SeqGroup extends Group {
  readonly type = "Sequence"
}

/**
 * A parallel group can end when all commands (ParallelCommandGroup), any command (ParallelRaceGroup),
 * or a specific command (ParallelDeadlineGroup) has finished. For deadline groups, set the end condition
 * to the array of the UUID of the command and the owner (e.g. the UUID of the subsystem, or "[robot]" for a globally
 * defined command)
 */
export type ParallelEndCondition =
  | UUID
  | "all"
  | "any";

export class ParGroup extends Group {
  readonly type = "Parallel"

  endCondition: ParallelEndCondition

  constructor(endCondition: ParallelEndCondition) {
    super()
    this.endCondition = endCondition
  }
}

type ConfigClosure<T> = (group: T, ...params: ParamPlaceholder[]) => void;

/**
 * Creates a sequential command group that can have its commands defined by the provided closure.
 *
 * @example
 *
 *   const seq = sequence((s, scoringAngle, outtakeDuration) => {
 *     s.run("Drive Base", "Drive To Scoring Location")
 *     s.run("Arm", "Move To Angle", scoringAngle)
 *     s.run("Wrist", "Flip Down")
 *     s.run("Intake", "Outtake").forNoLongerThan(outtakeDuration)
 *   });
 *
 *   seq.params // => [{ name: 'scoringAngle', owner: seq }, { name: 'outtakeDuration', owner: seq }]
 *
 * @param configure the configuring closure
 *
 * @return the command group
 */
export const sequence = function (configure: ConfigClosure<SeqGroup>): SeqGroup {
  const sequentialGroup = new SeqGroup()
  const params = getParams(configure).slice(1) // drop first param since it's the group. everything after is a param we want to capture
  sequentialGroup.params.push(...params.map(paramName => new ParamPlaceholder(paramName, null, [])))

  configure(sequentialGroup, ...sequentialGroup.params)
  return sequentialGroup
}

/**
 * Generates a parallel command group that can have its commands defined by the provided closure.
 *
 * @param endCondition the end condition of the group
 * @param configure the configuring closure
 *
 * @return the command group
 */
export const parallel = function (endCondition: ParallelEndCondition, configure: ConfigClosure<ParGroup>): ParGroup {
  const parallelGroup = new ParGroup(endCondition)
  const params = getParams(configure).slice(1) // drop first param since it's the group. everything after is a param we want to capture
  parallelGroup.params.push(...params.map(paramName => new ParamPlaceholder(paramName, null, [])))

  configure(parallelGroup, ...parallelGroup.params)
  return parallelGroup
}

const getParams = (func): string[] => {
  // String representation of the function code
  let str = func.toString()

  // Remove comments of the form /* ... */
  // Removing comments of the form //
  // Remove body of the function { ... }
  // removing '=>' if func is arrow function
  str = str.replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/(.)*/g, "")
    .replace(/{[\s\S]*}/, "")
    .replace(/=>/g, "")
    .trim()

  // Start parameter names after first '('
  const start = str.indexOf("(") + 1

  // End parameter names is just before last ')'
  const end = str.length - 1

  return str.substring(start, end)
    .split(", ")
    .map(e => e.replace(/=[\s\S]*/g, "").trim()) // remove default values, if present
    .filter(e => e.length > 0)
}
