// Поддерживаем ESM/CJS варианты backend (tsx loader может резолвить по-разному)
import Backend from 'i18next-fs-backend';
import i18next from 'i18next';

await i18next
  .use(Backend)
  .init({
    lng: 'ru',
    fallbackLng: 'ru',
    backend: {
      loadPath: './locales/{{lng}}.json',
    },
  });

export default i18next;