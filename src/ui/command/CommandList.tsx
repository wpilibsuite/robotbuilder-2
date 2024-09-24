import React from "react"
import { AtomicCommand } from "../../bindings/Command"
import { Button, Card, CardContent, CardHeader, Paper } from "@mui/material"

import * as IR from '../../bindings/ir'

type CommandListProps = {
  title: string;
  commands: (AtomicCommand | IR.Group)[];
  requestEdit: (group: IR.Group) => void;
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
                  (command instanceof IR.Group) ?
                    <Button onClick={ () => requestEdit(command) }>
                      Edit
                    </Button>
                    : <></> // not a group, can't edit
                }
              </div>
            )
          })
        }
      </CardContent>
    </Card>
  )
}
