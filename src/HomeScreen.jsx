import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoBulbOutline,
  IoChatbubblesOutline,
  IoTrendingUpOutline,
  IoSchoolOutline,
  IoNotificationsOutline,
  IoSparklesOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
} from 'react-icons/io5'
import { FaInstagram, FaTelegramPlane, FaYoutube } from 'react-icons/fa'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import AuthModal from './components/AuthModal.jsx'

const GOLD = '#E63946'

const cards = [
  {
    key: 'daily-insight',
    title: 'ערך יומי',
    desc: 'תובנה מעוררת השראה ליום שלך',
    Icon: IoBulbOutline,
  },
  {
    key: 'community',
    title: 'קהילה',
    desc: 'עדכוני קבוצה ושיתופים מהקהילה',
    Icon: IoChatbubblesOutline,
  },
  {
    key: 'stock-picks',
    title: 'המלצות על מניות',
    desc: 'סיגנלים יומיים/שבועיים למסחר',
    Icon: IoTrendingUpOutline,
  },
  {
    key: 'academy',
    title: 'לימודי מסחר',
    desc: 'קורסי וידאו ומסלולי למידה',
    Icon: IoSchoolOutline,
  },
  {
    key: 'live-alerts',
    title: 'התראות חמות',
    desc: 'מרכז התראות ופוש בזמן אמת',
    Icon: IoNotificationsOutline,
  },
  {
    key: 'mindset-faith',
    title: 'תובנות ואמונה',
    desc: 'מאמרים או פודקאסטים להשראה',
    Icon: IoSparklesOutline,
  },
]

export default function HomeScreen({ hasClerk = false }) {
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [sparkle, setSparkle] = useState(false)

  const handleHomeClick = () => {
    setActiveTab('home')
    setSparkle(true)
    window.clearTimeout(handleHomeClick._t)
    handleHomeClick._t = window.setTimeout(() => setSparkle(false), 800)
  }

  const handleCardClick = (cardKey) => {
    console.log('Card clicked:', cardKey)
    if (cardKey === 'daily-insight') {
      console.log('Navigating to /daily-insight')
      navigate('/daily-insight')
    }
    // בהמשך נוסיף את שאר המסכים
  }

  return (
    <div className="home-screen">
      <header className="nb-header">
        <div className="nb-header__gradient" />
        <div className="nb-header__content">
          <h1 className="nb-title">BOILER ROOM</h1>
          <p className="nb-subtitle">Trading • Mindset • Faith</p>
          <span className="nb-badge">welcome to the TOP&gt;</span>
          <div className="nb-socials" aria-label="Social links">
            <a href="https://www.youtube.com/@BoilerRoom.Israel" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <FaYoutube size={18} />
            </a>
            <a href="#" target="_self" aria-label="Instagram (demo)">
              <FaInstagram size={18} />
            </a>
            <a href="#" target="_self" aria-label="Telegram (demo)">
              <FaTelegramPlane size={18} />
            </a>
          </div>
        </div>
      </header>

      <main className="nb-main">
        <section className="nb-grid" aria-label="Main actions">
          {cards.map((item, idx) => (
            <button
              key={item.key}
              className="nb-card"
              type="button"
              style={{ animationDelay: `${idx * 80}ms` }}
              aria-label={`${item.title} - ${item.desc}`}
              onClick={() => handleCardClick(item.key)}
            >
              <div className="nb-card__icon" aria-hidden="true">
                <item.Icon size={28} color={GOLD} />
              </div>
              <div className="nb-card__text" dir="rtl">
                <h3 className="nb-card__title">{item.title}</h3>
                <p className="nb-card__desc">{item.desc}</p>
              </div>
            </button>
          ))}
        </section>
      </main>

      <nav className="nb-bottom-nav" aria-label="Primary">
        <button
          type="button"
          className={`nb-nav-item${activeTab === 'home' ? ' is-active' : ''}${sparkle ? ' sparkle' : ''}`}
          aria-current={activeTab === 'home' ? 'page' : undefined}
          onClick={handleHomeClick}
        >
          <IoHomeOutline size={22} color={GOLD} />
          <span>בית</span>
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'community' ? ' is-active' : ''}`}
          aria-current={activeTab === 'community' ? 'page' : undefined}
          onClick={() => setActiveTab('community')}
        >
          <IoChatbubblesOutline size={22} color={GOLD} />
          <span>קהילה</span>
        </button>

        <button
          type="button"
          className={`nb-nav-item${activeTab === 'courses' ? ' is-active' : ''}`}
          aria-current={activeTab === 'courses' ? 'page' : undefined}
          onClick={() => setActiveTab('courses')}
        >
          <IoSchoolOutline size={22} color={GOLD} />
          <span>קורסים</span>
        </button>

        {hasClerk ? (
          <>
            <SignedOut>
              <button
                type="button"
                className={`nb-nav-item${activeTab === 'profile' ? ' is-active' : ''}`}
                aria-current={activeTab === 'profile' ? 'page' : undefined}
                onClick={() => {
                  setActiveTab('profile')
                  setAuthOpen(true)
                }}
              >
                <IoPersonCircleOutline size={22} color={GOLD} />
                <span>פרופיל</span>
              </button>
            </SignedOut>
            <SignedIn>
              <button
                type="button"
                className={`nb-nav-item${activeTab === 'profile' ? ' is-active' : ''}`}
                aria-current={activeTab === 'profile' ? 'page' : undefined}
                onClick={() => setActiveTab('profile')}
                style={{ paddingTop: 4 }}
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-[28px] h-[28px]'
                    }
                  }}
                />
                <span>פרופיל</span>
              </button>
            </SignedIn>
          </>
        ) : (
          <button
            type="button"
            className={`nb-nav-item${activeTab === 'profile' ? ' is-active' : ''}`}
            aria-current={activeTab === 'profile' ? 'page' : undefined}
            onClick={() => setActiveTab('profile')}
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <IoPersonCircleOutline size={22} color={GOLD} />
            <span>בקרוב</span>
          </button>
        )}
      </nav>

      {hasClerk && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}
    </div>
  )
}


