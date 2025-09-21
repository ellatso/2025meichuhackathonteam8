import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './index.css'

// 創建 React 應用程式
const root = ReactDOM.createRoot(document.getElementById('root'))

// 渲染應用程式
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// 簡化的環境檢查
if (import.meta.env.DEV) {
  console.log('GLIDE-Lite development mode')
}