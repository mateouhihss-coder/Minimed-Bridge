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

console.log("[Мост] Включение глубокой диагностики структуры данных...");

const fetchCarelink = typeof bridge.carelink === 'function' ? bridge.carelink : (bridge.carelink.fetch || bridge.carelink.getHistory || Object.values(bridge.carelink).find(f => typeof f === 'function'));

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт ручной синхронизации...`);
  try {
    console.log("[Мост] Шаг 1: Запрос к CareLink...");
    let rawData = await fetchCarelink(config);
    
    if (!rawData) {
      console.log("[Мост] CareLink вернул пустой ответ.");
      return;
    }

    // ВЫВОД СТРУКТУРЫ ДЛЯ АНАЛИЗА
    console.log("[Диагностика] Тип данных CareLink:", typeof rawData);
    console.log("[Диагностика] Ключи корневого объекта:", Object.keys(rawData));
    
    // Если это массив объектов, посмотрим на первый элемент
    if (Array.isArray(rawData) && rawData.length > 0) {
      console.log("[Диагностика] Пример элемента массива:", JSON.stringify(rawData[0]).substring(0, 500));
    } else {
      // Если это объект, посмотрим на первые 500 символов его свойств (например, sgs или подобных)
      for (const key of Object.keys(rawData).slice(0, 3)) {
        console.log(`[Диагностика] Свойство [${key}]:`, JSON.stringify(rawData[key]).substring(0, 300));
      }
    }

    console.log("[Мост] Пробуем выполнить Шаг 2...");
    const transformedData = bridge.transform(rawData);
    console.log("[Мост] Успешная трансформация!");

  } catch (error) {
    console.error("[Ошибка конвейера]:", error.message || error);
  }
}

if (fetchCarelink) {
  syncData();
  setInterval(syncData, 300000);
}
