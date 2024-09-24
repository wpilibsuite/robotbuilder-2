import React, { CSSProperties, useEffect, useState } from "react"
import { Project } from "../../bindings/Project"
import { generateRobotClass } from "../../codegen/java/RobotGenerator"
import { Box } from "@mui/material"
import SyntaxHighlighter from "react-syntax-highlighter"
import * as SyntaxHighlightStyles from "react-syntax-highlighter/dist/esm/styles/hljs"

export function Robot({ project }: { project: Project }) {
  const [generatedCode, setGeneratedCode] = useState(generateRobotClass(project))

  useEffect(() => setGeneratedCode(generateRobotClass(project)), [project])

  return (
    <Box>
      <div style={{ height: "100%", overflow: "scroll" }}>
        <SyntaxHighlighter
          language="java"
          style={ SyntaxHighlightStyles.vs }
          showLineNumbers={ true }
          wrapLines={ true }
          lineProps={ (): { style: React.CSSProperties } => {
            const style: CSSProperties = { display: "block", fontSize: "10pt" }
            return { style }
          } }
        >
          { generatedCode }
        </SyntaxHighlighter>
      </div>
    </Box>
  )
}
