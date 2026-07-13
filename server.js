const http = require('http');
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

// Создаем подключение к CareLink
const client = new minimed.carelink.Client(config);

// Хак-исправление: принудительно прописываем актуальные базовые URL для CareLink EU,
// чтобы старая библиотека не падала с ошибкой "Invalid URL"
if (client.common && client.common.getSettings) {
  const originalSettings = client.common.getSettings();
  client.common.getSettings = function() {
    return {
      ...originalSettings,
      bleDirectBaseUrl: 'https://carelink.minimed.eu',
      b2cBaseUrl: 'https://carelink.minimed.eu/users/connect/token'
    };
  };
}

function syncData() {
  console.log(`[${new Date().toISOString()}] Делаем запрос в CareLink...`);
  
  client.fetch(async (err, data) => {
    if (err) {
      console.error('Произошла ошибка при запросе из CareLink:', err.message || err);
      if (err.stack) console.error('stack:', err.stack);
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

// Запуск сразу и повтор каждые 5 минут
syncData();
setInterval(syncData, 5 * 60 * 1000);

// Технический веб-сервер для Render
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Мост MiniMed работает в штатном режиме!\n');
});

server.listen(port, () => {
  console.log(`Технический веб-сервер запущен на порту ${port}`);
});
