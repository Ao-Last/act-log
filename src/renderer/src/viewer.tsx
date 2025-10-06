import React from 'react'
import ReactDOM from 'react-dom/client'
import LogViewer from './components/LogViewer'
import './assets/popup.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LogViewer />
  </React.StrictMode>
)

