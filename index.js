const http = require('http');

// Запуск веб-сервера для Render
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

console.log("[Мост] Перевод библиотеки на ручное принудительное управление...");

try {
  // Загружаем внутренний модуль опроса самой библиотеки
  // В большинстве форков minimed-connect-to-nightscout логика лежит в файле или методе cgm
  const cgm = require('minimed-connect-to-nightscout/cgm');
  
  if (typeof cgm === 'function') {
    console.log("[Мост] Модуль cgm успешно перехвачен. Запускаем ручной таймер...");
    
    // Функция принудительного опроса
    async function runPoll() {
      console.log(`[${new Date().toISOString()}] ==> Принудительный опрос CareLink...`);
      try {
        await cgm();
        console.log("[Мост] Запрос к CareLink выполнен.");
      } catch (err) {
        console.error("[Мост] Ошибка внутри выполнения cgm:", err.message || err);
      }
    }

    // Запускаем первый раз прямо сейчас
    runPoll();

    // Повторяем каждые 5 минут (300 000 миллисекунд)
    setInterval(runPoll, 300000);

  } else {
    console.log("[Внимание] Модуль cgm не является функцией. Пробуем альтернативный запуск...");
    require('minimed-connect-to-nightscout');
  }
} catch (error) {
  console.log("[Инфо] Прямой cgm не найден, пробуем стандартный запуск с логированием ошибок ядра...");
  try {
    const bridge = require('minimed-connect-to-nightscout');
    if (typeof bridge.init === 'function') bridge.init();
  } catch (e) {
    console.error("[Критическая ошибка]:", e.message);
  }
}
