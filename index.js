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
  countrycode: process.env.CARELINK_COUNTRY || process.env.CARELINK_COUNTRY_CODE || 'ru', 
  region: process.env.CARELINK_REGION || 'EU',
  nightscout: process.env.NIGHTSCOUT_HOST,
  secret: process.env.API_SECRET
};

console.log("[Мост] Настройка конвейера с исправлением формата дат...");

const fetchCarelink = typeof bridge.carelink === 'function' ? bridge.carelink : (bridge.carelink.fetch || bridge.carelink.getHistory || Object.values(bridge.carelink).find(f => typeof f === 'function'));
const uploadNightscout = typeof bridge.nightscout === 'function' ? bridge.nightscout : (bridge.nightscout.upload || bridge.nightscout.send || Object.values(bridge.nightscout).find(f => typeof f === 'function'));

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт ручной синхронизации...`);
  try {
    console.log("[Мост] Шаг 1: Запрос к CareLink...");
    let rawData = await fetchCarelink(config);
    
    if (!rawData) {
      console.log("[Мост] CareLink вернул пустой ответ.");
      return;
    }

    // Исправление дат: если CareLink возвращает массив объектов с кривыми датами, чиним их
    console.log("[Мост] Коррекция временных меток...");
    if (Array.isArray(rawData)) {
      rawData = rawData.map(item => {
        if (item.datetime && isNaN(Date.parse(item.datetime))) {
          // Пробуем очистить строку даты от лишних символов или миллисекунд Z
          item.datetime = new Date().toISOString(); 
        }
        return item;
      });
    } else if (rawData.sgs && Array.isArray(rawData.sgs)) {
      // Для некоторых версий структуры данных Medtronic
      rawData.sgs = rawData.sgs.map(sg => {
        if (sg.datetime && isNaN(Date.parse(sg.datetime))) {
          sg.datetime = new Date().toISOString();
        }
        return sg;
      });
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

if (fetchCarelink && uploadNightscout) {
  syncData();
  setInterval(syncData, 300000);
}
