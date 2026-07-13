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

function syncData() {
  console.log(`[${new Date().toISOString()}] Делаем запрос в CareLink...`);
  
  // Вызываем fetch прямо у созданного клиента и передаем колбэк (err, data)
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

      // Трансформируем данные в формат Nightscout
      const entries = minimed.transform(data);

      // Отправляем на сайт
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
