import * as IR from '../../../bindings/ir'
import { commandMethod } from "../../../codegen/java/CommandGroupGenerator"
import { unindent } from "../../../codegen/java/util"
import { Project } from "../../../bindings/Project"
import { test, expect } from 'vitest'

const EMPTY_PROJECT: Project = {
  commands: [], controllers: [], name: "", subsystems: [],
}

test("empty group", () => {
  const group = IR.sequence(() => null)

  const code = commandMethod(null, group, EMPTY_PROJECT)
  expect(code).toEqual(unindent(`
    public Command null() {
      /* Add some commands! */;
    }
  `).trim())
})

test("empty nested groups", () => {
  const group = IR.sequence((s) => {
    s.parallel("all", () => null)
    s.parallel("any", () => null)
  })

  const code = commandMethod(null, group, EMPTY_PROJECT)
  expect(code).toEqual(unindent(`
    public Command null() {
      return (/* empty group */)
               .andThen((/* empty group */)).withName("null");
    }
  `).trim())
})

test("empty nested groups with decorators", () => {
  const group = IR.sequence((s) => {
    s.parallel("all", () => null).repeatingForever().until("() -> someCond")
    s.parallel("any", () => null).forNoLongerThan(15).unless("() -> someOtherCond")
  })

  const code = commandMethod(null, group, EMPTY_PROJECT)
  expect(code).toEqual(unindent(`
    public Command null() {
      return (/* empty group */).repeatedly().until(() -> someCond)
               .andThen((/* empty group */).withTimeout(15 /* seconds */).unless(() -> someOtherCond)).withName("null");
    }
  `).trim())
})

test("empty nested groups with params", () => {
  const group = IR.sequence((s) => {
    s.parallel("all", () => null).repeatingForever().until("() -> someCond")
    s.parallel("any", () => null).forNoLongerThan(15).unless("() -> someOtherCond")
  })

  const code = commandMethod(null, group, EMPTY_PROJECT)
  expect(code).toEqual(unindent(`
    public Command null() {
      return (/* empty group */).repeatedly().until(() -> someCond)
               .andThen((/* empty group */).withTimeout(15 /* seconds */).unless(() -> someOtherCond)).withName("null");
    }
  `).trim())
})
