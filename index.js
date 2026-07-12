const http = require('http');

// Создаем сервер, который намертво глушит любые проверки от Render ответом "всё ок"
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Слушает порт ${port} на всех интерфейсах`);
});

// Запуск загрузчика Medtronic
try {
  console.log("Инициализация загрузчика Medtronic...");
  require('minimed-connect-to-nightscout');
  console.log("Загрузчик успешно запущен, ожидаем подключение...");
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ:");
  console.error(error.message);
  process.exit(1);
}
