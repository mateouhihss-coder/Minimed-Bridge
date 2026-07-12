const http = require('http');
const path = require('path');

// 1. Запуск веб-сервера для Render, чтобы сервис не засыпал
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Проверка Render активна на порту ${port}`);
});

// 2. Жесткий запуск основного процесса моста
try {
  console.log("Инициализация основного цикла Medtronic...");
  
  // Находим путь к главному файлу библиотеки внутри установленных пакетов
  const libraryPath = require.resolve('minimed-connect-to-nightscout');
  
  // Принудительно запускаем этот файл на выполнение
  require(libraryPath);
  
  console.log("Скрипт моста успешно внедрен в процесс.");
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ МОСТА:");
  console.error(error.message);
  process.exit(1);
}
