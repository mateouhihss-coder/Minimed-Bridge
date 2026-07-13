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

// Инициализируем клиенты CareLink и Nightscout из библиотеки
const carelinkClient = new minimed.carelink.Client(config);

async function syncData() {
  try {
    console.log(`[${new Date().toISOString()}] Запрос данных из CareLink...`);
    
    // Получаем последние данные от помпы
    const data = await carelinkClient.getRecentData();
    
    if (!data || !data.sgs || data.sgs.length === 0) {
      console.log('Новых сахаров в CareLink не обнаружено.');
      return;
    }

    console.log(`Получено сахаров: ${data.sgs.length}. Отправка в Nightscout...`);

    // Форматируем данные для Nightscout через встроенный трансформатор библиотеки
    const entries = minimed.transform(data);

    // Отправляем данные на ваш сайт Nightscout
    await minimed.nightscout.upload(nsUrl, nsSecret, entries);
    console.log('Данные успешно доставлены в Nightscout!');

  } catch (error) {
    console.error('Ошибка в работе моста:', error.message);
  }
}

// Первый запуск при старте
syncData();

// Повторяем процедуру каждые 5 минут
setInterval(syncData, 5 * 60 * 1000);
