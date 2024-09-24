import { HelpOutlineOutlined } from "@mui/icons-material"
import { Tooltip } from "@mui/material"
import React, { useState } from "react"

type HelpableLabelProps = {
  description: string
  children: React.ReactNode
}

export function HelpableLabel({ description, children }: HelpableLabelProps) {
  const [showIcon, setShowIcon] = useState(false)

  return (
    <span onMouseEnter={ () => setShowIcon(true) } onMouseLeave={ () => setShowIcon(false) } className="helpable-label">
      <span className="helpable-label-text">
        {
          children
        }
      </span>
      <Tooltip title={ description }>
        <HelpOutlineOutlined className={ `helpable-label-icon ${ showIcon ? 'visible' : 'invisible' }` } />
      </Tooltip>
    </span>
  )
}
