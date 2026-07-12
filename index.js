const http = require('http');

const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});
server.listen(port, '0.0.0.0');

// Принудительно выводим все логи в консоль
process.stdout.write = process.stderr.write = console.log.bind(console);

console.log("[DEBUG] Запуск инициализации...");

try {
  // Загружаем настройки и библиотеку
  const bridge = require('minimed-connect-to-nightscout');
  console.log("[DEBUG] Библиотека загружена.");

  // Попробуем запустить процесс с явным выводом всех событий
  console.log("[DEBUG] Попытка старта цикла опроса...");
  // Многие версии этой библиотеки требуют вызова функции start()
  if (typeof bridge.start === 'function') {
      bridge.start();
      console.log("[DEBUG] Функция start() вызвана.");
  } else {
      console.log("[DEBUG] Библиотека запущена в автоматическом режиме.");
  }

} catch (error) {
  console.error("[КРИТИЧЕСКАЯ ОШИБКА]:", error);
}
