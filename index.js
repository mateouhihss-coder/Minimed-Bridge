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
  console.log("[Мост] Запуск Medtronic с прямым выводом логов...");
  
  const targetScript = require.resolve('minimed-connect-to-nightscout');
  
  // Магия здесь: stdio: 'inherit' заставит библиотеку писать логи прямо в Render
  const child = fork(targetScript, [], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DEBUG: '*'
    }
  });

  console.log("[Мост] Процесс успешно изолирован.");
} catch (error) {
  console.error("[Критическая ошибка]:", error.message);
}
