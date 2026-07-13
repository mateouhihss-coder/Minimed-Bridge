const { CareLinkClient } = require('nightscout-connect-carelink');

const axios = require('axios');

// 1. НАСТРОЙКА ДОСТУПА (Заполните своими данными обязательно внутри кавычек!)
const CARELINK_USERNAME = NIKITA_khali;
const CARELINK_PASSWORD = Dilutthdhgd_6767;

const NIGHTSCOUT_URL = "https://huesosminimed.onrender.com"; 
const NIGHTSCOUT_API_SECRET = ALEKSEYNAVALNIY1487;

// Регион для Польши/Европы оставляем 'EU'
const client = new CareLinkClient({
  username: CARELINK_USERNAME,
  password: CARELINK_PASSWORD,
  region: 'EU'
});

async function syncData() {
  try {
    console.log(`[${new Date().toISOString()}] Запрос данных из CareLink...`);
    
    // Получаем последние сахара
    const data = await client.getLastGlucoseData();
    
    if (!data || data.length === 0) {
      console.log('Новых данных в CareLink нет.');
      return;
    }

    console.log(`Получено ${data.length} записей. Отправка в Nightscout...`);

    // Переводим данные в формат Nightscout
    const entries = data.map(item => ({
      sgv: item.glucose,
      date: new Date(item.datetime).getTime(),
      dateString: item.datetime,
      direction: item.trend,
      device: 'CareLinkBridge',
      type: 'sgv'
    }));

    // Отправляем на ваш сайт Nightscout
    await axios.post(`${NIGHTSCOUT_URL}/api/v1/entries`, entries, {
      headers: {
        'API-SECRET': NIGHTSCOUT_API_SECRET,
        'Content-Type': 'application/json'
      }
    });

    console.log('Синхронизация успешно выполнена!');
    
    // Выведем токен в лог один раз, чтобы он у нас был на будущее
    const currentToken = client.getRefreshToken();
    if (currentToken) {
      console.log(`[ИНФО] Текущий refresh_token: ${currentToken}`);
    }

  } catch (error) {
    console.error('Ошибка моста:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    }
  }
}

// Запускаем веб-сервер, чтобы Render не ругался, что порт 10000 пустует
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Мост работает в фоне!'));
app.listen(process.env.PORT || 10000, () => {
  console.log('Веб-сервер заглушки активен.');
  
  // Запуск цикла синхронизации каждые 5 минут
  syncData();
  setInterval(syncData, 5 * 60 * 1000);
});
