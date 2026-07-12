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

console.log("[Мост] Поиск скрытых функций внутри модулей...");

// Определяем правильные функции для CareLink и Nightscout
const fetchCarelink = typeof bridge.carelink === 'function' ? bridge.carelink : (bridge.carelink.fetch || bridge.carelink.getHistory || Object.values(bridge.carelink).find(f => typeof f === 'function'));
const uploadNightscout = typeof bridge.nightscout === 'function' ? bridge.nightscout : (bridge.nightscout.upload || bridge.nightscout.send || Object.values(bridge.nightscout).find(f => typeof f === 'function'));

console.log("[Диагностика] Carelink метод:", typeof fetchCarelink);
console.log("[Диагностика] Nightscout метод:", typeof uploadNightscout);

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт ручной синхронизации...`);
  try {
    if (!fetchCarelink || !uploadNightscout) {
      throw new Error(`Не удалось определить функции. Доступно в carelink: ${Object.keys(bridge.carelink)}, в nightscout: ${Object.keys(bridge.nightscout)}`);
    }

    console.log("[Мост] Шаг 1: Запрос к CareLink...");
    // Вызываем функцию с контекстом самого модуля, на случай если ей нужен внутренний `this`
    const rawData = await fetchCarelink.call(bridge.carelink);
    
    if (!rawData) {
      console.log("[Мост] CareLink вернул пустой ответ.");
      return;
    }

    console.log("[Мост] Шаг 2: Трансформация...");
    const transformedData = bridge.transform(rawData);
    const filteredData = bridge.filter ? bridge.filter(transformedData) : transformedData;

    console.log("[Мост] Шаг 3: Отправка в Nightscout...");
    await uploadNightscout.call(bridge.nightscout, filteredData);
    
    console.log("[Успех 🎉] Данные сахара доставлены в Nightscout!");

  } catch (error) {
    console.error("[Ошибка выполнения конвейера]:", error.message || error);
  }
}

// Запуск
if (fetchCarelink && uploadNightscout) {
  syncData();
  setInterval(syncData, 300000);
} else {
  console.log("[Критическая ошибка] Структура методов не распознана. Ключи carelink:", Object.keys(bridge.carelink));
}
