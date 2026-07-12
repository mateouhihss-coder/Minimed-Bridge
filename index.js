const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

console.log("[Мост] Сканирование внутренностей библиотеки...");

try {
  // Находим, где физически лежит главный файл библиотеки
  const mainPath = require.resolve('minimed-connect-to-nightscout');
  console.log(`[Мост] Путь к библиотеке: ${mainPath}`);
  
  const bridge = require(mainPath);
  
  // Выводим все доступные ключи и методы объекта библиотеки
  console.log("[Мост] Доступные методы в коде:", Object.keys(bridge));
  console.log("[Мост] Тип экспорта:", typeof bridge);

  // Читаем первые 50 строк исходного кода, чтобы увидеть, что она делает при старте
  const sourceCode = fs.readFileSync(mainPath, 'utf8');
  console.log("=== НАЧАЛО ИСХОДНОГО КОДА ===");
  console.log(sourceCode.split('\n').slice(0, 60).join('\n'));
  console.log("=== КОНЕЦ ИСХОДНОГО КОДА ===");

} catch (error) {
  console.error("[Ошибка сканирования]:", error.message);
}
