const http = require('http');
const { fork } = require('child_process');
const path = require('path');

// 1. Привязка секретного ключа Nightscout
if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

// 2. Веб-сервер для Render (чтобы сервис был "Live")
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Успешно запущен на порту ${port}`);
});

// 3. Запуск библиотеки в отдельном изолированном процессе (как в терминале)
try {
  console.log("[Мост] Попытка прямого запуска библиотеки Medtronic...");
  
  // Находим путь к исполняемому файлу библиотеки
  const binPath = path.join(__dirname, 'node_modules', 'minimed-connect-to-nightscout', 'bin', 'minimed-connect-to-nightscout.js');
  
  // Запускаем дочерний процесс
  const child = fork(binPath, [], {
    env: process.env // Пробрасываем все наши переменные окружения
  });

  child.on('message', (msg) => {
    console.log('[Библиотека]:', msg);
  });

  child.on('error', (err) => {
    console.error('[Ошибка библиотеки]:', err.message);
  });

  console.log("[Мост] Процесс библиотеки успешно изолирован и запущен.");
} catch (error) {
  console.error("[Критическая ошибка запуска]:", error.message);
}
