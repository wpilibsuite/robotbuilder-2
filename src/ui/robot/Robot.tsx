import React, { CSSProperties, useEffect, useState } from "react"
import { GeneratedFile, Project } from "../../bindings/Project"
import { Box } from "@mui/material"
import SyntaxHighlighter from "react-syntax-highlighter"
import * as SyntaxHighlightStyles from "react-syntax-highlighter/dist/cjs/styles/hljs"
import { RichTreeView } from "@mui/x-tree-view/RichTreeView"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { ROBOT_CLASS_PATH } from "../../codegen/java/util"

type FileTreeEntry = {
  id: string
  label: string
  children: FileTreeEntry[]
}

const dirsFirst = (a: FileTreeEntry, b: FileTreeEntry): number => {
  if (a.children.length > 0) {
    if (b.children.length > 0) {
      // both dirs, sort by name
      return a.label.localeCompare(b.label)
    } else {
      // a is a dir, b is not, a goes first
      return -1
    }
  } else if (b.children.length > 0) {
    // b is dir, a is not, b goes first
    return 1
  } else {
    // both files, sort by name
    return a.label.localeCompare(b.label)
  }
}

const treeify = (generatedFiles: GeneratedFile[]): FileTreeEntry[] => {
  const result: FileTreeEntry[] = []
  const level = { children: result }

  generatedFiles.forEach(file => {
    const pathSegments = file.name.split("/")

    pathSegments.reduce((accum, name, i) => {
      if (!accum[name]) {
        accum[name] = { children: [] }

        accum.children.push({ id: pathSegments.slice(0, i + 1).join("/"), label: name, children: accum[name].children })
      }

      return accum[name]
    }, level)
  })

  return result
}

const sortTree = (roots: FileTreeEntry[], sorter: (a: FileTreeEntry, b: FileTreeEntry) => number): FileTreeEntry[] => {
  roots.forEach(root => {
    root.children = root.children.sort(sorter)
    sortTree(root.children, sorter) // recursion
  })

  return roots.sort(sorter)
}

export function Robot({ project }: { project: Project }) {
  const [selectedFile, setSelectedFile] = useState(project.generatedFiles.find(f => f.name === ROBOT_CLASS_PATH))

  // Reload the current file when the project changes
  useEffect(() => {
    const currentFile = selectedFile
    const correspondingFile = project.generatedFiles.find(f => f.name === currentFile.name)

    if (correspondingFile !== undefined) {
      // The project changed but still has a file in the same path. Keep it rendered.
      setSelectedFile(correspondingFile)
    } else {
      // Fall back to render the README. This should still exist, right?
      setSelectedFile(project.generatedFiles.find(f => f.name === "README.md"))
    }
  }, [project])

  return (
    <PanelGroup direction="horizontal" style={{ height: "100%" }}>
      <Panel defaultSize={ 30 } minSize={ 20 }>
        <div style={{ overflowY: "scroll", overflowX: "scroll", width: "100%", margin: "1em 0" }}>
          <RichTreeView items={ sortTree(treeify(project.generatedFiles), dirsFirst) }
                        defaultSelectedItems={ ROBOT_CLASS_PATH }
                        onSelectedItemsChange={ (event: React.SyntheticEvent, id: string) => {
                          console.log("Selected file(s)", id)
                          console.log("  All files:", project.generatedFiles.map(f => f.name))
                          const file = project.generatedFiles.find(file => file.name === id)
                          console.log("  File:", file)
                          if (file && !file.hidden && file.contents) {
                            setSelectedFile(file)
                          }
                        } }>
          </RichTreeView>
        </div>
      </Panel>
      <PanelResizeHandle className="code-panel-divider" />
      <Panel defaultSize={ 70 } minSize={ 50 } style={{ height: "calc(100% - 50px)", overflowY: "clip" }}>
        <Box style={{ height: "100%" }}>
          <code style={{ padding: "0.5em", paddingLeft: "3em", fontSize: "10pt", color: "gray" }}>
            /{ selectedFile.name }
          </code>
          <div style={{ height: "100%", overflowY: "scroll" }}>
            <SyntaxHighlighter
              language={ selectedFile.name.split(".").slice(-1)[0] }
              style={ SyntaxHighlightStyles.vs }
              showLineNumbers={ true }
              wrapLines={ true }
              lineProps={ (): { style: React.CSSProperties } => {
                const style: CSSProperties = { display: "block", fontSize: "10pt" }
                return { style }
              } }
            >
              { selectedFile.contents }
            </SyntaxHighlighter>
          </div>
        </Box>
      </Panel>
    </PanelGroup>
  )
}
