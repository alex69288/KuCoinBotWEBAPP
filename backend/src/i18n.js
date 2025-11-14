const i18next = require('i18next');
const Backend = require('i18next-fs-backend');

i18next
  .use(Backend)
  .init({
    lng: 'ru',
    fallbackLng: 'ru',
    backend: {
      loadPath: './locales/{{lng}}.json',
    },
  });

module.exports = i18next;