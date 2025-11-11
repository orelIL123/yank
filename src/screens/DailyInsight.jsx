import React from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCalendarOutline, IoTimeOutline } from 'react-icons/io5'

const GOLD = '#E63946'

// Mock data - בהמשך יבוא מ-Firebase
const todayInsight = {
  id: 1,
  date: new Date().toLocaleDateString('he-IL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  title: 'הכוח של סבלנות במסחר',
  content: `המסחר הוא מרתון, לא ספרינט. 

כשאתה מתחיל את הדרך, אתה רוצה תוצאות מהירות. אתה רוצה לראות את החשבון גדל כל יום, לחוש את ההצלחה מיד. אבל האמת היא שהמסחר המצליח בנוי על סבלנות, משמעת, ואמונה בתהליך.

כל טריידר מצליח עבר את התקופות הקשות. את הימים שבהם השוק נע נגדו, את השבועות שבהם הכל נראה אפור. אבל מה שמייחד אותם זה שהם לא ויתרו.

הם הבינו משהו פשוט אך עמוק:
✨ הצלחה במסחר היא תוצאה של עקביות לאורך זמן
✨ כל טעות היא שיעור
✨ כל יום הוא הזדמנות חדשה

אז היום, תזכור:
אתה לא מתחרה עם אף אחד חוץ מעצמך אתמול. 
התמקד בתהליך, לא רק בתוצאה.
סבלנות + משמעת = הצלחה.

💪 המשך לצמוח, המשך להאמין.`,
  readTime: '2 דקות קריאה',
  author: 'טל פרטוק',
  category: 'Mindset',
}

export default function DailyInsight() {
  const navigate = useNavigate()

  return (
    <div className="daily-insight-screen">
      {/* Header with back button */}
      <header className="di-header">
        <button 
          className="di-back-btn" 
          onClick={() => navigate('/')}
          aria-label="חזרה לדף הבית"
        >
          <IoArrowBack size={24} color={GOLD} />
        </button>
        <h1 className="di-header-title">ערך יומי</h1>
        <div style={{ width: 24 }} /> {/* Spacer for centering */}
      </header>

      {/* Main content */}
      <main className="di-main">
        <article className="di-card">
          {/* Category badge */}
          <div className="di-category">{todayInsight.category}</div>
          
          {/* Title */}
          <h2 className="di-title">{todayInsight.title}</h2>
          
          {/* Meta info */}
          <div className="di-meta">
            <div className="di-meta-item">
              <IoCalendarOutline size={16} color={GOLD} />
              <span>{todayInsight.date}</span>
            </div>
            <div className="di-meta-item">
              <IoTimeOutline size={16} color={GOLD} />
              <span>{todayInsight.readTime}</span>
            </div>
          </div>

          {/* Content */}
          <div className="di-content">
            {todayInsight.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="di-paragraph">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Author */}
          <div className="di-author">
            <div className="di-author-avatar">TF</div>
            <div className="di-author-info">
              <div className="di-author-name">{todayInsight.author}</div>
              <div className="di-author-title">Trader • Mentor • Faith</div>
            </div>
          </div>
        </article>

        {/* Motivational footer */}
        <div className="di-footer-note">
          <p>💫 התובנה הבאה תגיע מחר בשעה 08:00</p>
          <p className="di-footer-small">תקבל התראה ישירות לטלפון</p>
        </div>
      </main>
    </div>
  )
}

