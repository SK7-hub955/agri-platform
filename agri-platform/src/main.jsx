import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // use relative path

const rootElement = document.getElementById('app') // ensure this id exists in index.html
if (!rootElement) {
  throw new Error('Root element with id "app" not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
