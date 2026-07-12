const http = require('http');
const { fork } = require('child_process');

// 1. Привязка секретного ключа Nightscout
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

// 2. Веб-сервер для Render (чтобы сервис оставался "Live")
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Успешно запущен на порту ${port}`);
});

// 3. Запуск библиотеки в отдельном процессе с автоматическим определением пути
try {
  console.log("[Мост] Попытка автоматического поиска и запуска Medtronic...");
  
  // Node.js сам найдет точный путь к главному исполняемому файлу библиотеки
  const targetScript = require.resolve('minimed-connect-to-nightscout');
  console.log(`[Мост] Найден целевой скрипт: ${targetScript}`);
  
  // Запускаем процесс, как самостоятельное CLI-приложение
  const child = fork(targetScript, [], {
    env: {
      ...process.env,
      DEBUG: '*' // На всякий случай включаем полный вывод логов внутри процесса
    }
  });

  child.on('error', (err) => {
    console.error('[Ошибка дочернего процесса]:', err.message);
  });

  console.log("[Мост] Процесс библиотеки успешно изолирован и запущен.");
} catch (error) {
  console.error("[Критическая ошибка запуска]:", error.message);
}
