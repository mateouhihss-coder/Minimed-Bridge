const http = require('http');

// ХАК: Перехватываем стандартный системный класс URL в Node.js.
// Когда старая библиотека CareLink попробует создать поломанную или пустую ссылку,
// мы поймаем этот момент и подставим рабочий адрес CareLink EU.
const OriginalURL = global.URL;
global.URL = function(url, base) {
  try {
    // Если ссылка пустая или ломает парсер, подменяем на рабочий домен
    if (!url || url === 'undefined' || url.includes('undefined')) {
      url = 'https://carelink.minimed.eu/users/connect/token';
    }
    return new OriginalURL(url, base);
  } catch (e) {
    console.log(`[Фикс URL] Исправлена неверная ссылка: "${url}"`);
    return new OriginalURL('https://carelink.minimed.eu/users/connect/token', base);
  }
};
global.URL.prototype = OriginalURL.prototype;

const minimed = require('minimed-connect-to-nightscout');

const nsUrl = process.env.NS_URL || 
              process.env.NIGHTSCOUT_URL || 
              process.env.NIGHTSCOUT_HOST || 
              process.env.nightscout_Host;

const nsSecret = process.env.API_SECRET || 
                 process.env.NIGHTSCOUT_API_SECRET;

const config = {
  username: process.env.CARELINK_USERNAME,
  password: process.env.CARELINK_PASSWORD,
  server: process.env.CARELINK_SERVER || 'EU'
};

console.log('Запуск моста MiniMed -> Nightscout...');
console.log('Регион CareLink:', config.server);
console.log('Целевой Nightscout:', nsUrl);

const client = new minimed.carelink.Client(config);

function syncData() {
  console.log(`[${new Date().toISOString()}] Делаем запрос в CareLink...`);
  
  client.fetch(async (err, data) => {
    if (err) {
      console.error('Произошла ошибка при запросе из CareLink:', err.message || err);
      return;
    }

    try {
      if (!data) {
        console.log('CareLink вернул пустой ответ (нет данных).');
        return;
      }

      console.log('Данные из CareLink успешно получены! Отправляем в Nightscout...');

      const entries = minimed.transform(data);
      await minimed.nightscout.upload(nsUrl, nsSecret, entries);
      console.log('Ура! Данные успешно доставлены на ваш Nightscout!');

    } catch (error) {
      console.error('Ошибка при обработке или отправке данных:', error.message);
    }
  });
}

// Старт
syncData();
setInterval(syncData, 5 * 60 * 1000);

// Технический веб-сервер
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Мост MiniMed работает!\n');
});

server.listen(port, () => {
  console.log(`Технический веб-сервер запущен на порту ${port}`);
});
