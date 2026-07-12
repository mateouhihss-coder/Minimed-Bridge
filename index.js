const http = require('http');

// Перенаправляем вашу переменную в стандартную для библиотеки
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

// Сервер для Render
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Слушает порт ${port}`);
});

// Запуск загрузчика Medtronic
try {
  console.log("Инициализация загрузчика Medtronic...");
  require('minimed-connect-to-nightscout');
  console.log("Загрузчик успешно импортирован.");
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ:");
  console.error(error.message);
  process.exit(1);
}
