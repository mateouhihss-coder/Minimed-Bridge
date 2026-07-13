const http = require('http');
const bridge = require('minimed-connect-to-nightscout');

// 1. Поднимаем веб-сервер для Render
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

// Синхронизируем секреты Nightscout
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

// 2. Формируем объект настроек для библиотеки
const config = {
  username: process.env.CARELINK_USERNAME,
  password: process.env.CARELINK_PASSWORD,
  countrycode: process.env.CARELINK_COUNTRY || process.env.CARELINK_COUNTRY_CODE || 'ru', 
  region: process.env.CARELINK_REGION || 'EU',
  nightscout: process.env.NIGHTSCOUT_HOST,
  secret: process.env.API_SECRET
};

console.log("[Мост] Передача конфигурации CareLink (Регион:", config.region, ", Страна:", config.countrycode, ")...");

const fetchCarelink = typeof bridge.carelink === 'function' ? bridge.carelink : (bridge.carelink.fetch || bridge.carelink.getHistory || Object.values(bridge.carelink).find(f => typeof f === 'function'));
const uploadNightscout = typeof bridge.nightscout === 'function' ? bridge.nightscout : (bridge.nightscout.upload || bridge.nightscout.send || Object.values(bridge.nightscout).find(f => typeof f === 'function'));

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт ручной синхронизации...`);
  try {
    console.log("[Мост] Шаг 1: Запрос к CareLink с учетными данными...");
    // Передаем настройки прямо в вызов функции
    const rawData = await fetchCarelink(config);
    
    if (!rawData) {
      console.log("[Мост] CareLink вернул пустой ответ (нет новых сахаров).");
      return;
    }

    console.log("[Мост] Шаг 2: Трансформация данных...");
    const transformedData = bridge.transform(rawData);
    const filteredData = bridge.filter ? bridge.filter(transformedData) : transformedData;

    console.log("[Мост] Шаг 3: Отправка в Nightscout...");
    // Передаем отфильтрованные данные и настройки
    await uploadNightscout(filteredData, config);
    
    console.log("[Успех 🎉] Данные сахара успешно доставлены в Nightscout!");

  } catch (error) {
    console.error("[Ошибка конвейера]:", error.message || error);
  }
}

// Запуск цикла опроса
if (fetchCarelink && uploadNightscout) {
  syncData();
  setInterval(syncData, 300000); // Каждые 5 минут
} else {
  console.error("[Критическая ошибка] Не найдены функции опроса.");
}
