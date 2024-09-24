import "./App.scss"
import React from "react"
import { makeNewProject } from "./bindings/Project"
import { ProjectView } from "./ui/ProjectView"
import useMediaQuery from "@mui/material/useMediaQuery"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode],
  )

  return (
    <ThemeProvider theme={ theme }>
      <CssBaseline/>
      <ProjectView initialProject={ makeNewProject() }/>
    </ThemeProvider>
  )
}

export default App
