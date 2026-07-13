const express = require('express');
const minimedConnect = require('minimed-connect');
const app = express();

// НАСТРОЙКИ
const CARELINK_USERNAME = "NIKITA_khali";
const CARELINK_PASSWORD = "Dilutthdhgd_6767";
const NIGHTSCOUT_URL = "https://huesosminimed.onrender.com"; 
const NIGHTSCOUT_API_SECRET = "ALEKSEYNAVALNIY1487";

// Инициализируем клиент с указанием региона EU
const carelink = new minimedConnect.Client({
  username: CARELINK_USERNAME,
  password: CARELINK_PASSWORD,
  region: 'EU' 
});

async function syncData() {
  try {
    console.log(`[${new Date().toISOString()}] Запрос данных через minimed-connect...`);
    
    // Получаем данные от CareLink
    const data = await carelink.getRecentData();
    
    if (!data || !data.sgs || data.sgs.length === 0) {
      console.log('Новых сахаров в CareLink не обнаружено.');
      return;
    }

    console.log(`Получено сахаров: ${data.sgs.length}. Отправка в Nightscout...`);

    // Форматируем для Nightscout
    const entries = data.sgs.map(item => ({
      sgv: item.value,
      date: new Date(item.datetime).getTime(),
      dateString: item.datetime,
      direction: item.trend || 'NONE',
      device: 'MiniMedConnectBridge',
      type: 'sgv'
    }));

    // Отправляем в ваш Nightscout
    const nsResponse = await fetch(`${NIGHTSCOUT_URL}/api/v1/entries`, {
      method: 'POST',
      headers: {
        'API-SECRET': NIGHTSCOUT_API_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entries)
    });

    if (nsResponse.ok) {
      console.log('Данные успешно доставлены в Nightscout!');
    } else {
      console.error(`Nightscout вернул статус: ${nsResponse.status}`);
    }

  } catch (error) {
    console.error('Ошибка в работе моста:', error.message);
  }
}

// Сервер-заглушка для Render
app.get('/', (req, res) => res.send('Мост через minimed-connect работает!'));
app.listen(process.env.PORT || 10000, () => {
  console.log('Сервер запущен.');
  
  // Запуск первой синхронизации
  syncData();
  // Интервал 5 минут
  setInterval(syncData, 5 * 60 * 1000);
});
