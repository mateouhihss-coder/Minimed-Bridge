const MinimedBridge = require('minimed-connect-to-nightscout');

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

try {
  // Корректный запуск для версии 1.5.8 через конструктор new
  const activeBridge = new MinimedBridge(config);
  console.log('Мост успешно инициализирован и запущен.');
} catch (error) {
  console.error('Критическая ошибка при инициализации моста:', error.message);
}
