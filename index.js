const http = require('http');

// Включаем принудительный вывод всех отладочных логов библиотеки в консоль
process.env.DEBUG = '*';

// Сервер для Render
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

try {
  console.log("Инициализация загрузчика Medtronic с отладкой логов...");
  
  const libraryPath = require.resolve('minimed-connect-to-nightscout');
  require(libraryPath);
  
  console.log("Загрузчик активен. Ожидаем вывод отладки (DEBUG)...");
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА:");
  console.error(error.message);
  process.exit(1);
}
