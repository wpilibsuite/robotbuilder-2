import * as IR from '../../../bindings/ir'
import { commandMethod } from "../../../codegen/java/CommandGroupGenerator";
import { unindent } from "../../../codegen/java/util";
import { Project } from "../../../bindings/Project";

const EMPTY_PROJECT: Project = {
  commands: [], controllers: [], name: "", subsystems: []
}

test("empty group", () => {
  const group = IR.sequence((s) => null);

  const code = commandMethod(null, group, EMPTY_PROJECT);
  expect(code).toEqual(unindent(`
    public CommandBase null() {
      /* Add some commands! */;
    }
  `).trim())
})

test("empty nested groups", () => {
  const group = IR.sequence((s) => {
    s.parallel("all", (p) => null);
    s.parallel("any", (p) => null);
  })

  const code = commandMethod(null, group, EMPTY_PROJECT);
  expect(code).toEqual(unindent(`
    public CommandBase null() {
      return (/* empty group */)
               .andThen((/* empty group */));
    }
  `).trim())
})

test("empty nested groups with decorators", () => {
  const group = IR.sequence((s) => {
    s.parallel("all", (p) => null).repeatingForever().until("() -> someCond");
    s.parallel("any", (p) => null).forNoLongerThan(15).unless("() -> someOtherCond");
  })

  const code = commandMethod(null, group, EMPTY_PROJECT);
  expect(code).toEqual(unindent(`
    public CommandBase null() {
      return (/* empty group */).repeatedly().until(() -> someCond)
               .andThen((/* empty group */).withTimeout(15 /* seconds */).unless(() -> someOtherCond));
    }
  `).trim())
})

test("empty nested groups with params", () => {
  const group = IR.sequence((s, p1, p2) => {
    s.parallel("all", (p) => null).repeatingForever().until("() -> someCond");
    s.parallel("any", (pp2p1) => null).forNoLongerThan(15).unless("() -> someOtherCond");
  })

  const code = commandMethod(null, group, EMPTY_PROJECT);
  expect(code).toEqual(unindent(`
    public CommandBase null() {
      return (/* empty group */).repeatedly().until(() -> someCond)
               .andThen((/* empty group */).withTimeout(15 /* seconds */).unless(() -> someOtherCond));
    }
  `).trim())
})