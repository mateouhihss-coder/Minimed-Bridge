const http = require('http');

// Сервер для Render
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Слушает порт ${port}`);
});

// Запуск загрузчика Medtronic с явным вызовом основного метода
try {
  console.log("Инициализация загрузчика Medtronic...");
  const bridge = require('minimed-connect-to-nightscout');
  
  // Если библиотека экспортирует функцию запуска напрямую, вызываем её
  if (typeof bridge === 'function') {
    bridge();
    console.log("Основная функция загрузчика успешно вызвана.");
  } else if (bridge && typeof bridge.start === 'function') {
    bridge.start();
    console.log("Метод .start() загрузчика успешно вызван.");
  } else {
    console.log("Библиотека импортирована, ожидаем автоматический цикл...");
  }
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ:");
  console.error(error.message);
  process.exit(1);
}
