import React from 'react'
import Sidebar from './Sidebar'
import SirenBanner from './SirenBanner'

export default function Layout({ title, subtitle, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <SirenBanner />
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
        </div>
        <div className="page fade-in">{children}</div>
      </div>
    </div>
  )
}
