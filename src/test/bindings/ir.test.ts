import { sequence } from "../../bindings/ir"
import { test, expect } from "vitest"

test("basic", () => {
  const s = sequence((s, p1, p2) => {
    s.run("Drive Base", "Command X", p1, p2, "hardcoded")
  })

  const b = [{ name: "p1", original: null }, { name: "p2", original: null }]
  expect(s.params.every((obj, i) => obj.name === b[i].name && obj.original === b[i].original)).toEqual(true)
})

test("nesting", () => {
  const group = sequence((s) => {
    s.parallel("all", (p) => {
      p.run("systemX", "commandA")
      p.run("systemX", "commandB")
      p.run("systemX", "commandC")
    })

    s.parallel("any", (p) => {
      p.run("x", "A")
      p.run("x", "B")
      p.runGlobal("Some Other Group")
    })

    s.parallel("Some Other Group", (p) => {
      p.runGlobal("Some Other Group")
      p.run("x", "A")
    })
  })

  console.log(group)

  expect(group.params).toEqual([])
  expect(group.commands.length).toEqual(3)
})

