const http = require('http');

// 1. Включаем отладочные логи для всех модулей ДО загрузки библиотеки
process.env.DEBUG = '*';

const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Успешно запущен на порту ${port}`);
});

// Синхронизация секретов для Nightscout
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

console.log("[Мост] Запуск с включенным режимом подробного вывода логов...");

try {
  const bridge = require('minimed-connect-to-nightscout');
  
  // Проверяем, как именно библиотека хочет быть запущенной
  if (typeof bridge === 'function') {
    console.log("[Мост] Обнаружен функциональный экспорт. Запуск...");
    bridge();
  } else if (bridge && typeof bridge.start === 'function') {
    console.log("[Мост] Обнаружен метод start(). Запуск...");
    bridge.start();
  } else {
    console.log("[Мост] Библиотека загружена и должна работать автоматически.");
  }
} catch (error) {
  console.error("[Ошибка инициализации]:", error.message);
}
