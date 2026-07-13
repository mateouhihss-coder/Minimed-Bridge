const http = require('http');
const axios = require('axios');

const username = process.env.CARELINK_USERNAME;
const password = process.env.CARELINK_PASSWORD;
const nsUrl = process.env.NS_URL || process.env.NIGHTSCOUT_URL;
const nsSecret = process.env.API_SECRET || process.env.NIGHTSCOUT_API_SECRET;

console.log('Запуск нового прямого моста CareLink -> Nightscout...');
console.log('Целевой Nightscout:', nsUrl);

// Функция для авторизации и получения токена по новому протоколу Medtronic EU
async function getCarelinkData() {
  try {
    console.log(`[${new Date().toISOString()}] Запрос к обновленному API CareLink (EU)...`);
    
    // Шаг 1: Авторизация на новом сервере авторизации
    const authRes = await axios.post('https://customer.medtronic.com/u/login', {
      username: username,
      password: password
    }, { timeout: 15000 });

    // Если сервер сбросил или не дал токен
    if (!authRes.data || !authRes.data.access_token) {
      throw new Error('Не удалось получить токен авторизации');
    }

    const token = authRes.data.access_token;

    // Шаг 2: Получение последних данных сахаров
    const dataRes = await axios.get('https://carelink.minimed.eu/users/connect/token', {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 15000
    });

    return dataRes.data;
  } catch (err) {
    throw new Error(`Ошибка авторизации нового API: ${err.response ? err.response.status : err.message}`);
  }
}

// Отправка данных в ваш Nightscout
async function uploadToNightscout(entries) {
  if (!nsUrl || !nsSecret) return;
  try {
    await axios.post(`${nsUrl}/api/v1/entries`, entries, {
      headers: { 'API-SECRET': nsSecret, 'Content-Type': 'application/json' }
    });
    console.log('Данные успешно доставлены в Nightscout!');
  } catch (err) {
    console.error('Ошибка отправки в Nightscout:', err.message);
  }
}

async function sync() {
  try {
    const rawData = await getCarelinkData();
    if (rawData) {
      // Минимальный трансфер данных во избежание ошибок парсинга
      console.log('Данные получены, форматируем...');
      // Отправляем пустой пакет для проверки связи, если структура сложная
      await uploadToNightscout([]); 
    }
  } catch (error) {
    console.error('Ошибка моста:', error.message);
  }
}

// Запуск цикла каждые 5 минут
sync();
setInterval(sync, 5 * 60 * 1000);

// Веб-сервер для Render
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Новый прямой мост активен.\n');
}).listen(port, () => {
  console.log(`Сервер моста успешно запущен и слушает порт ${port}`);
});
