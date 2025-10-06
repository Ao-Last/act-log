import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './components/Popup'
import './assets/popup.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)

