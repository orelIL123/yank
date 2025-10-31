import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import splashPhoto from '../photos/splashphoto.png'
import HomeScreen from './HomeScreen.jsx'
import DailyInsight from './screens/DailyInsight.jsx'

export default function App({ hasClerk = false }) {
  const [showSplash, setShowSplash] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const startFadeTimeout = window.setTimeout(() => setIsFading(true), 2000) // show for 2s
    const removeTimeout = window.setTimeout(() => setShowSplash(false), 3000) // then fade out for 1s
    return () => {
      window.clearTimeout(startFadeTimeout)
      window.clearTimeout(removeTimeout)
    }
  }, [])

  return (
    <div className="app-root">
      {showSplash && (
        <div className={`splash-overlay${isFading ? ' is-fading' : ''}`} role="dialog" aria-label="Splash screen">
          <img className="splash-image" src={splashPhoto} alt="Splash" />
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomeScreen hasClerk={hasClerk} />} />
        <Route path="/daily-insight" element={<DailyInsight />} />
      </Routes>
    </div>
  )
}


