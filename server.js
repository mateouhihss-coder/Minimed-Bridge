const minimedModule = require('minimed-connect-to-nightscout');

console.log('--- ДИАГНОСТИКА БИБЛИОТЕКИ ---');
console.log('Тип экспорта:', typeof minimedModule);
console.log('Содержимое:', minimedModule);
if (minimedModule && typeof minimedModule === 'object') {
  console.log('Доступные ключи:', Object.keys(minimedModule));
}
console.log('--------------------------------');

const nsUrl = process.env.NS_URL || 
              process.env.NIGHTSCOUT_URL || 
              process.env.NIGHTSCOUT_HOST || 
              process.env.nightscout_Host;

const nsSecret = process.env.API_SECRET || 
                 process.env.NIGHTSCOUT_API_SECRET;

const config = {
  carelink: {
    username: process.env.CARELINK_USERNAME,
    password: process.env.CARELINK_PASSWORD,
    server: process.env.CARELINK_SERVER || 'EU'
  },
  nightscout: {
    url: nsUrl,
    secret: nsSecret
  },
  interval: 60000 // Проверка каждую минуту
};

console.log('Запуск моста MiniMed -> Nightscout...');
console.log('Регион CareLink:', config.carelink.server);
console.log('Целевой Nightscout:', config.nightscout.url);

// Ищем функцию запуска во всех возможных местах экспорта
let runFn = null;

if (typeof minimedModule === 'function') {
  runFn = minimedModule;
} else if (minimedModule && typeof minimedModule === 'object') {
  if (typeof minimedModule.default === 'function') {
    console.log('Найдена функция в .default');
    runFn = minimedModule.default;
  } else if (typeof minimedModule.Bridge === 'function') {
    console.log('Найдена функция в .Bridge');
    runFn = minimedModule.Bridge;
  } else if (typeof minimedModule.bridge === 'function') {
    console.log('Найдена функция в .bridge');
    runFn = minimedModule.bridge;
  } else {
    // Если стандартные ключи не подошли, берем первую попавшуюся функцию из объекта
    for (const key of Object.keys(minimedModule)) {
      if (typeof minimedModule[key] === 'function') {
        console.log(`Используем функцию из ключа: ${key}`);
        runFn = minimedModule[key];
        break;
      }
    }
  }
}

// Запускаем найденную функцию
if (runFn) {
  try {
    console.log('Пробуем запустить как конструктор (new)...');
    new runFn(config);
    console.log('Мост успешно инициализирован через "new".');
  } catch (e) {
    if (e.message.includes('is not a constructor') || e.message.includes('cannot be invoked without')) {
      console.log('Объект не является конструктором. Пробуем вызов как обычной функции...');
      try {
        runFn(config);
        console.log('Мост успешно запущен как функция.');
      } catch (err) {
        console.error('Ошибка при вызове функции моста:', err.message);
      }
    } else {
      console.error('Ошибка при запуске моста:', e.message);
    }
  }
} else {
  console.error('Критическая ошибка: В импортированном модуле не найдено функций для запуска!');
}
