const http = require('http');
const bridge = require('minimed-connect-to-nightscout');

// 1. Поднимаем обязательный веб-сервер для Render
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

// Синхронизируем секретные ключи
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

console.log("[Мост] Ручная сборка конвейера CareLink -> Nightscout запущена.");

// 2. Главная функция опроса
async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Начало синхронизации данных...`);
  try {
    // Шаг А: Скачиваем последние данные из Medtronic CareLink
    console.log("[Мост] Запрос данных из CareLink...");
    const rawData = await bridge.carelink();
    
    if (!rawData) {
      console.log("[Мост] Сервер CareLink вернул пустые данные или сахара не изменились.");
      return;
    }

    // Шаг Б: Трансформируем данные в формат Nightscout
    console.log("[Мост] Трансформация данных...");
    const transformedData = bridge.transform(rawData);

    // Шаг В: Фильтруем дубликаты
    const filteredData = bridge.filter(transformedData);

    // Шаг Г: Отправляем в ваш Nightscout
    console.log("[Мост] Отправка данных в Nightscout...");
    await bridge.nightscout(filteredData);
    
    console.log("[Успех 🎉] Новые сахара успешно загружены в Nightscout!");

  } catch (error) {
    console.error("[Ошибка конвейера]:", error.message || error);
  }
}

// Запускаем опрос сразу при старте
syncData();

// Повторяем процедуру каждые 5 минут (300 000 мс)
setInterval(syncData, 300000);
