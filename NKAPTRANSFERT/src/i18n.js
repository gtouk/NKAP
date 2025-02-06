import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import fr from './translations/fr.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      fr:fr
    },
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
