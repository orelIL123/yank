import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoMusicalNotesOutline,
  IoBookOutline,
  IoSchoolOutline,
  IoHeartOutline,
  IoSparklesOutline,
  IoPersonCircleOutline,
  IoPiano,
} from 'react-icons/io5'
import { FaInstagram, FaTelegramPlane } from 'react-icons/fa'
// Clerk removed - using Firebase instead
// AuthModal removed - using Firebase instead
import { homeCards } from './data/cards.js'

const ACCENT = '#4A90E2'

export default function HomeScreen({ hasClerk = false }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')

  const handleHomeClick = () => {
    setActiveTab('home')
  }

  const handleCardClick = (cardKey) => {
    console.log('Card clicked:', cardKey)
    if (cardKey === 'torah-daily') {
      navigate('/daily-insight')
    }
  }

  return (
    <div className="home-screen">
      <header className="nb-header">
        <div className="nb-header__gradient" />
        <div className="nb-header__content" dir="rtl">
          <h1 className="nb-title">הודו לה׳ כי טוב</h1>
          <p className="nb-subtitle">תורות • תפילות • ניגונים</p>
          <span className="nb-badge">בית מדרש הינוקא</span>
          <div className="nb-socials" aria-label="קישורי קהילה">
            <a href="#" target="_self" aria-label="Instagram (demo)">
              <FaInstagram size={18} />
            </a>
            <a href="#" target="_self" aria-label="Telegram (demo)">
              <FaTelegramPlane size={18} />
            </a>
          </div>
        </div>
      </header>

      <main className="nb-main" dir="rtl">
        <section className="nb-grid" aria-label="תכנים מרכזיים">
          {homeCards.map((item, idx) => (
            <button
              key={item.key}
              className="nb-card"
              type="button"
              style={{ animationDelay: `${idx * 80}ms` }}
              aria-label={`${item.title} - ${item.description}`}
              onClick={() => handleCardClick(item.key)}
            >
              <div className="nb-card__background" aria-hidden="true">
                <img src={item.image} alt="" loading="lazy" />
                <div className="nb-card__overlay" />
              </div>
              <div className="nb-card__text">
                <h3 className="nb-card__title">{item.title}</h3>
                <p className="nb-card__desc">{item.description}</p>
              </div>
            </button>
          ))}
        </section>
      </main>

      <nav className="nb-bottom-nav" aria-label="ראשי">
        <button
          type="button"
          className={`nb-nav-item${activeTab === 'home' ? ' is-active' : ''}`}
          aria-current={activeTab === 'home' ? 'page' : undefined}
          onClick={handleHomeClick}
        >
          <IoMusicalNotesOutline size={22} color={ACCENT} />
          <span>בית</span>
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'piano' ? ' is-active' : ''}`}
          aria-current={activeTab === 'piano' ? 'page' : undefined}
          onClick={() => { setActiveTab('piano'); navigate('/piano'); }}
        >
          <IoPiano size={22} color={ACCENT} />
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'tefilot' ? ' is-active' : ''}`}
          aria-current={activeTab === 'tefilot' ? 'page' : undefined}
          onClick={() => setActiveTab('tefilot')}
        >
          <IoHeartOutline size={22} color={ACCENT} />
          <span>תפילות</span>
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'torah' ? ' is-active' : ''}`}
          aria-current={activeTab === 'torah' ? 'page' : undefined}
          onClick={() => setActiveTab('torah')}
        >
          <IoBookOutline size={22} color={ACCENT} />
          <span>תורה</span>
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'beis' ? ' is-active' : ''}`}
          aria-current={activeTab === 'beis' ? 'page' : undefined}
          onClick={() => setActiveTab('beis')}
        >
          <IoSparklesOutline size={22} color={ACCENT} />
          <span>בית מדרש</span>
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'profile' ? ' is-active' : ''}`}
          aria-current={activeTab === 'profile' ? 'page' : undefined}
          onClick={() => setActiveTab('profile')}
          disabled
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
        >
          <IoPersonCircleOutline size={22} color={ACCENT} />
          <span>בקרוב</span>
        </button>
      </nav>

      {/* AuthModal removed - using Firebase instead */}
    </div>
  )
}


