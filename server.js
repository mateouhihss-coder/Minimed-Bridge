const http = require('http');

// Улучшенный хак-перехватчик системного класса URL.
// Теперь мы берем относительные ссылки авторизации, которые генерирует библиотека (начинающиеся с /u/login),
// и принудительно отправляем их на актуальный рабочий сервер авторизации Medtronic CareLink.
const OriginalURL = global.URL;
global.URL = function(url, base) {
  try {
    if (typeof url === 'string') {
      // Если библиотека пытается ломиться на несуществующий адрес авторизации
      if (url.startsWith('/u/login') || url.includes('universal-login')) {
        return new OriginalURL(url, 'https://customer.medtronic.com');
      }
      // Если ссылка сломана или пустая
      if (url === 'undefined' || url.includes('undefined')) {
        url = 'https://carelink.minimed.eu/users/connect/token';
      }
    }
    return new OriginalURL(url, base);
  } catch (e) {
    // В случае любого сбоя парсера направляем на правильный шлюз авторизации
    if (typeof url === 'string' && url.startsWith('/')) {
      return new OriginalURL(url, 'https://customer.medtronic.com');
    }
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

// Старт моста
syncData();
setInterval(syncData, 5 * 60 * 1000);

// Технический веб-сервер для удержания Render в онлайне
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Мост MiniMed работает!\n');
});

server.listen(port, () => {
  console.log(`Технический веб-сервер запущен на порту ${port}`);
});
