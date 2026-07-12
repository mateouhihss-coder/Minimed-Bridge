const http = require('http');

// 1. Привязка секретного ключа Nightscout
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

// 2. Инициализация библиотеки моста
let bridge;
try {
  bridge = require('minimed-connect-to-nightscout');
  console.log("[Мост] Библиотека Medtronic успешно загружена в память.");
} catch (e) {
  console.error("[Критическая ошибка] Не удалось загрузить библиотеку:", e.message);
}

// 3. Функция принудительного запуска опроса CareLink
function runSync() {
  console.log(`[${new Date().toLocaleTimeString()}] -> Запуск принудительного цикла синхронизации сахаров...`);
  
  try {
    // В зависимости от версии форка библиотеки, запускаем доступный метод
    if (typeof bridge === 'function') {
      bridge();
    } else if (bridge && typeof bridge.start === 'function') {
      bridge.start();
    } else if (bridge && typeof bridge.init === 'function') {
      bridge.init();
    } else {
      console.log("[Предупреждение] У библиотеки нет явного метода запуска. Проверьте переменные окружения.");
    }
  } catch (err) {
    console.error("[Ошибка цикла]:", err.message);
  }
}

// Запускаем опрос сразу при старте и затем каждые 5 минут (300 000 мс)
if (bridge) {
  setTimeout(runSync, 5000); // первый запуск через 5 секунд после старта сервера
  setInterval(runSync, 300000);
}

// 4. Веб-сервер для удержания Render в сети
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  // При обращении к сайту моста можно принудительно пнуть синхронизацию
  if (req.url === '/sync') {
    runSync();
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Синхронизация запущена вручную!');
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Слушает порт ${port}. Для ручного пинка используйте /sync`);
});
