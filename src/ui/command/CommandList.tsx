import React from "react";
import { Command, CommandGroup } from "../../bindings/Command";
import { Button, Card, CardContent, CardHeader, Paper } from "@mui/material";

type CommandListProps = {
  title: string;
  commands: Command[];
  requestEdit: (group: CommandGroup) => void;
}

export function CommandList({ title, commands, requestEdit }: CommandListProps) {
  return (
    <Card className="command-list" component={ Paper }>
      <CardHeader title={ title }>
      </CardHeader>

      <CardContent className="commands">
        {
          commands.map((command) => {
            return (
              <div key={command.uuid}>
                { command.name }
                {
                  command.type === "SequentialGroup" || command.type === "ParallelGroup" ?
                    <Button onClick={ () => requestEdit(command) }>
                      Edit
                    </Button>
                    : <></>
                }
              </div>
            );
          })
        }
      </CardContent>
    </Card>
  )
}
