const http = require('http');
const bridge = require('minimed-connect-to-nightscout');

const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

const config = {
  username: process.env.CARELINK_USERNAME,
  password: process.env.CARELINK_PASSWORD,
  countrycode: process.env.CARELINK_COUNTRY || process.env.CARELINK_COUNTRY_CODE || 'pl', 
  region: process.env.CARELINK_REGION || 'EU',
  nightscout: process.env.NIGHTSCOUT_HOST,
  secret: process.env.API_SECRET
};

console.log("[Мост] Инициализация двухэтапного конвейера CareLink...");

const initCarelink = typeof bridge.carelink === 'function' ? bridge.carelink : bridge.carelink.init;
const uploadNightscout = typeof bridge.nightscout === 'function' ? bridge.nightscout : (bridge.nightscout.upload || bridge.nightscout.send || Object.values(bridge.nightscout).find(f => typeof f === 'function'));

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт синхронизации...`);
  try {
    console.log("[Мост] Шаг 1А: Инициализация клиента CareLink...");
    const client = await initCarelink(config);
    
    console.log("[Мост] Шаг 1Б: Получение реальных данных о сахарах...");
    // Вот тут мы вызываем настоящий fetch, полученный от клиента
    const rawData = await client.fetch();
    
    if (!rawData) {
      console.log("[Мост] От CareLink получен пустой ответ.");
      return;
    }

    console.log("[Мост] Шаг 2: Трансформация данных...");
    const transformedData = bridge.transform(rawData);
    const filteredData = bridge.filter ? bridge.filter(transformedData) : transformedData;

    console.log("[Мост] Шаг 3: Отправка в Nightscout...");
    await uploadNightscout(filteredData, config);
    
    console.log("[Успех 🎉] Данные сахара успешно доставлены в Nightscout!");

  } catch (error) {
    console.error("[Ошибка конвейера]:", error.message || error);
  }
}

if (initCarelink && uploadNightscout) {
  syncData();
  setInterval(syncData, 300000); // Каждые 5 минут
} else {
  console.error("[Критическая ошибка] Не удалось настроить функции моста.");
}
