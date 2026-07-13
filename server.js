const bridge = require('minimed-connect-to-nightscout');

// Пробуем все возможные варианты имени переменной для адреса Nightscout
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

// Запуск библиотеки
if (typeof bridge === 'function') {
  bridge(config);
} else if (bridge && typeof bridge.start === 'function') {
  bridge.start(config);
} else {
  console.error('Ошибка: не удалось определить метод запуска библиотеки!');
}
