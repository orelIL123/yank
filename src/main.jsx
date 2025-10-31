import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './styles.css'

const container = document.getElementById('root')
const root = createRoot(container)

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const hasClerk = Boolean(PUBLISHABLE_KEY)

const appTree = hasClerk ? (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App hasClerk />
  </ClerkProvider>
) : (
  <App hasClerk={false} />
)

root.render(
  <React.StrictMode>
    <BrowserRouter>{appTree}</BrowserRouter>
  </React.StrictMode>
)


