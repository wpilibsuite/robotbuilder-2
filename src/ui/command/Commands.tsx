import { Command } from "../../bindings/Command";

type CommandTypeProps = {
  command: Command;

  entryType: "full" | "leader" | "follower" | "racer";
}

function CommandTile({ command, entryType }: CommandTypeProps) {

}

export function Commands() {
  return (
    <div className={"commands"}>
      COMMANDS GO HERE
    </div>
  )
}
