const http = require('http');

// Создаем пустой веб-сервер для Render, чтобы он не гасил приложение
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Medtronic Bridge is running...\n');
});

server.listen(port, () => {
  console.log(`[Веб-сервер] Запущен на порту ${port}`);
});

// Запуск самого загрузчика Medtronic
try {
  console.log("Инициализация загрузчика Medtronic...");
  require('minimed-connect-to-nightscout');
  console.log("Загрузчик успешно запущен, ожидаем подключение...");
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ:");
  console.error(error.message);
  process.exit(1);
}
