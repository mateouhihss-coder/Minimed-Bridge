const bridge = require('minimed-connect-to-nightscout');

const config = {
  carelink: {
    username: process.env.CARELINK_USERNAME,
    password: process.env.CARELINK_PASSWORD,
    server: process.env.CARELINK_SERVER || 'EU'
  },
  nightscout: {
    url: process.env.NS_URL,
    secret: process.env.API_SECRET
  },
  interval: 60000 // Проверка каждую минуту
};

console.log('Запуск моста MiniMed -> Nightscout...');
console.log('Регион CareLink:', config.carelink.server);
console.log('Целевой Nightscout:', config.nightscout.url);

bridge.start(config);
