const http = require('http');
const { fork } = require('child_process');

if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Запущен на порту ${port}`);
});

try {
  console.log("[Мост] Попытка контролируемого запуска библиотеки...");
  
  const targetScript = require.resolve('minimed-connect-to-nightscout');
  
  const child = fork(targetScript, [], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'], // Перехватываем вообще все потоки вывода
    env: {
      ...process.env,
      DEBUG: '*' // Форсируем вывод отладки для всех модулей
    }
  });

  // Отслеживаем неожиданное закрытие процесса
  child.on('exit', (code, signal) => {
    console.error(`[Внимание] Процесс библиотеки завершился сам! Код выхода: ${code}, Сигнал: ${signal}`);
    console.error("Это означает, что библиотека проверила переменные окружения и принудительно закрылась. Проверьте правильность логина/пароля/ссылки.");
  });

  console.log("[Мост] Контроль над процессом установлен.");
} catch (error) {
  console.error("[Критическая ошибка]:", error.message);
}
