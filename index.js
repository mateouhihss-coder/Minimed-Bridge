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

console.log("[Мост] Адаптация старого колбэк-метода fetch...");

const clientFactory = typeof bridge.carelink === 'function' ? bridge.carelink : Object.values(bridge.carelink).find(f => typeof f === 'function');
const uploadNightscout = typeof bridge.nightscout === 'function' ? bridge.nightscout : (bridge.nightscout.upload || bridge.nightscout.send || Object.values(bridge.nightscout).find(f => typeof f === 'function'));

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт синхронизации...`);
  try {
    console.log("[Мост] Шаг 1А: Инициализация клиента CareLink...");
    const client = await clientFactory(config);
    
    let rawData;
    if (client && typeof client.fetch === 'function') {
      console.log("[Мост] Шаг 1Б: Запрос данных через колбэк...");
      
      // Оборачиваем старый колбэк-стиль в современный Promise
      rawData = await new Promise((resolve, reject) => {
        client.fetch((err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });
    } else {
      console.log("[Мост] Данные получены напрямую из фабрики.");
      rawData = client;
    }
    
    if (!rawData) {
      console.log("[Мост] Ответ от CareLink пуст.");
      return;
    }

    console.log("[Мост] Шаг 2: Трансформация данных...");
    const transformedData = bridge.transform(rawData);
    const filteredData = bridge.filter ? bridge.filter(transformedData) : transformedData;

    console.log("[Мост] Шаг 3: Отправка в Nightscout...");
    
    // Проверим, не требует ли метод nightscout тоже колбэк
    if (typeof uploadNightscout === 'function') {
      await new Promise((resolve, reject) => {
        const result = uploadNightscout(filteredData, config, (err) => {
          if (err) return reject(err);
          resolve();
        });
        // Если метод вернул Promise сам, завершаем обертку
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        }
      });
    }
    
    console.log("[Успех 🎉] Данные сахара успешно доставлены в Nightscout!");

  } catch (error) {
    console.error("[Ошибка конвейера]:", error.message || error);
  }
}

if (clientFactory && uploadNightscout) {
  syncData();
  setInterval(syncData, 300000); // Каждые 5 минут
} else {
  console.error("[Критическая ошибка] Не удалось настроить функции моста.");
}
