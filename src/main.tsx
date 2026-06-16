import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/src/App'
import './index.css'
import './assets/style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)

// Esconde splash de boot
requestAnimationFrame(() => {
  setTimeout(() => {
    window.dispatchEvent(new Event('cf:app-ready'))
  }, 50)
})
