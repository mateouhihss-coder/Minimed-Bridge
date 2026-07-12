const http = require('http');
const { fork } = require('child_process');

// Веб-сервер для Render
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});
server.listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Запущен на порту ${port}`);
});

// Проверка наличия переменных перед запуском
const requiredEnv = ['CARELINK_USERNAME', 'CARELINK_PASSWORD', 'CARELINK_REGION', 'NIGHTSCOUT_HOST'];
const missing = requiredEnv.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`[Критическая ошибка] Переменные окружения отсутствуют: ${missing.join(', ')}`);
  console.error("Пожалуйста, добавьте их в панель управления Render -> Environment.");
} else {
  try {
    console.log("[Мост] Все переменные на месте. Запуск библиотеки...");
    
    // Подстраховка для секретного ключа
    if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
      process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
    }

    const targetScript = require.resolve('minimed-connect-to-nightscout');
    
    const child = fork(targetScript, [], {
      stdio: 'inherit', // Передаем логи библиотеки напрямую в консоль Render
      env: process.env   // Явно пробрасываем абсолютно все переменные
    });

    child.on('exit', (code) => {
      console.log(`[Мост] Библиотека завершила работу с кодом: ${code}`);
    });

  } catch (error) {
    console.error("[Ошибка запуска]:", error.message);
  }
}
