import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import StoreProvider from './redux/StoreProvider'
import { AuthProvider } from './context/AuthContext'
import DataBootstrap from './components/DataBootstrap'
import ChatWidget from './components/ChatWidget'
import App from './App'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <Toaster />
          <DataBootstrap />
          <App />
          <ChatWidget />
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
)
