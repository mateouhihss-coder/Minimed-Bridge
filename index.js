const http = require('http');

// Держим порт для Render, чтобы сервис не падал
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});
server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

// Синхронизируем секреты
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

console.log("[Мост] Запуск библиотеки напрямую для перехвата внутренних ошибок...");

try {
  // Прямой запуск кода библиотеки в основном потоке
  require('minimed-connect-to-nightscout/index.js');
  console.log("[Мост] Библиотека успешно инициализирована.");
} catch (error) {
  console.error("==========================================");
  console.error("[КРАШ БИБЛИОТЕКИ] Поймано скрытое исключение:");
  console.error(error.stack || error.message || error);
  console.error("==========================================");
}
