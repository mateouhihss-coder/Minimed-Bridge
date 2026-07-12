try {
  console.log("Инициализация загрузчика Medtronic...");
  require('minimed-connect-to-nightscout');
  console.log("Загрузчик успешно запущен, ожидаем подключение...");
} catch (error) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ:");
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

