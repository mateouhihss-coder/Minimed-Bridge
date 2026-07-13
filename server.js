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

// Инициализируем клиент CareLink
const carelinkClient = new minimed.carelink.Client(config);

async function syncData() {
  try {
    console.log(`[${new Date().toISOString()}] Запрос данных из CareLink...`);
    
    // Используем правильный метод fetch для получения данных в версии 1.5.8
    const data = await carelinkClient.fetch();
    
    if (!data || !data.sgs || data.sgs.length === 0) {
      console.log('Новых сахаров в CareLink не обнаружено.');
      return;
    }

    console.log(`Получено сахаров: ${data.sgs.length}. Отправка в Nightscout...`);

    // Форматируем и отправляем
    const entries = minimed.transform(data);
    await minimed.nightscout.upload(nsUrl, nsSecret, entries);
    console.log('Данные успешно доставлены в Nightscout!');

  } catch (error) {
    console.error('Ошибка в работе моста:', error.message);
  }
}

// Запускаем опрос по таймеру
syncData();
setInterval(syncData, 5 * 60 * 1000);

// Заглушка веб-сервера, чтобы Render не ругался на отсутствие портов
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Minimed Bridge is running ok!\n');
});

server.listen(port, () => {
  console.log(`Сервер моста успешно запущен и слушает порт ${port}`);
});
