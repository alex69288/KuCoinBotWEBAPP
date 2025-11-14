import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next
  .use(Backend)
  .init({
    lng: 'ru',
    fallbackLng: 'ru',
    backend: {
      loadPath: './locales/{{lng}}.json',
    },
  });

export default i18next;