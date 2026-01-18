import * as Localization from 'expo-localization'

// Translations
const translations = {
  he: {
    'מבית רבינו': 'מבית רבינו',
    'סיפורי הבעש"ט': 'סיפורי הבעש"ט',
    'מהנעשה בבית המדרש': 'מהנעשה בבית המדרש',
    'קטגוריות': 'קטגוריות',
    'עלונים': 'עלונים',
    'תפילות הינוקא': 'תפילות הינוקא',
    'לימוד יומי': 'לימוד יומי',
    'חידושים': 'חידושים',
    'ספרים': 'ספרים',
    'ניגונים': 'ניגונים',
    'חדשות': 'חדשות',
    'פרופיל': 'פרופיל',
    'התראות': 'התראות',
    'פדיון נפש': 'פדיון נפש',
    'קורסים': 'קורסים',
    'ערך יומי': 'ערך יומי',
    'צדיקים': 'צדיקים',
    'ספריית לימוד': 'ספריית לימוד',
    'אדמין': 'אדמין',
    'צור קשר': 'צור קשר',
    'חידושים יומיים': 'חידושים יומיים',
    'פדיון נפש': 'פדיון נפש',
    'התראות חמות': 'התראות חמות',
    'ספר תולדות אדם': 'ספר תולדות אדם',
  },
  fr: {
    'מבית רבינו': 'De la Maison de notre Maître',
    'סיפורי הבעש"ט': 'Histoires du Baal Shem Tov',
    'מהנעשה בבית המדרש': 'De ce qui se passe à la Yeshiva',
    'קטגוריות': 'Catégories',
    'עלונים': 'Bulletins',
    'תפילות הינוקא': 'Prière du Yanuka',
    'לימוד יומי': 'Étude quotidienne',
    'חידושים': 'Innovations',
    'ספרים': 'Livres',
    'ניגונים': 'Mélodies',
    'חדשות': 'Actualités',
    'פרופיל': 'Profil',
    'התראות': 'Notifications',
    'פדיון נפש': 'Rachat de l\'âme',
    'קורסים': 'Cours',
    'ערך יומי': 'Valeur quotidienne',
    'צדיקים': 'Justes',
    'ספריית לימוד': 'Bibliothèque d\'étude',
    'אדמין': 'Admin',
    'צור קשר': 'Contact',
    'חידושים יומיים': 'Innovations quotidiennes',
    'פדיון נפש': 'Rachat de l\'âme',
    'התראות חמות': 'Alertes chaudes',
    'ספר תולדות אדם': 'Livre des générations de l\'homme',
  },
  en: {
    'מבית רבינו': 'From Our Master\'s House',
    'סיפורי הבעש"ט': 'Stories of the Baal Shem Tov',
    'מהנעשה בבית המדרש': 'From the Yeshiva',
    'קטגוריות': 'Categories',
    'עלונים': 'Newsletters',
    'תפילות הינוקא': 'Yanuka Prayers',
    'לימוד יומי': 'Daily Learning',
    'חידושים': 'Innovations',
    'ספרים': 'Books',
    'ניגונים': 'Melodies',
    'חדשות': 'News',
    'פרופיל': 'Profile',
    'התראות': 'Notifications',
    'פדיון נפש': 'Redemption of the Soul',
    'קורסים': 'Courses',
    'ערך יומי': 'Daily Value',
    'צדיקים': 'Righteous Ones',
    'ספריית לימוד': 'Learning Library',
    'אדמין': 'Admin',
    'צור קשר': 'Contact',
    'חידושים יומיים': 'Daily Innovations',
    'פדיון נפש': 'Redemption of the Soul',
    'התראות חמות': 'Hot Alerts',
    'ספר תולדות אדם': 'Book of Generations of Man',
  },
}

// Get current locale
export const getLocale = () => {
  const locale = Localization.getLocales()[0]?.languageCode || 'he'
  return locale === 'he' || locale === 'fr' || locale === 'en' ? locale : 'he'
}

// Translate function
export const t = (key) => {
  const locale = getLocale()
  return translations[locale]?.[key] || translations['he']?.[key] || key
}

// Get all translations for a key
export const getAllTranslations = (key) => {
  return {
    he: translations.he[key] || key,
    fr: translations.fr[key] || key,
    en: translations.en[key] || key,
  }
}




