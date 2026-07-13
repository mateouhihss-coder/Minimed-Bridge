const express = require('express');
const app = express();

// 1. НАСТРОЙКИ (Заполните в кавычках)
const CARELINK_USERNAME ="NIKITA_khali";
const CARELINK_PASSWORD = "Dilutthdhgd_6767";
const NIGHTSCOUT_URL = "https://huesosminimed.onrender.com"; 
const NIGHTSCOUT_API_SECRET = "ALEKSEYNAVALNIY1487";

async function syncData() {
  try {
    console.log(`[${new Date().toISOString()}] Запрос к обновленному API CareLink (EU)...`);
    
    // Шаг А: Авторизация через актуальный EU шлюз Medtronic
    const loginUrl = 'https://carelink.minimed.eu/api/users/login';
    const authResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      },
      body: JSON.stringify({
        username: CARELINK_USERNAME,
        password: CARELINK_PASSWORD
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Ошибка авторизации нового API: ${authResponse.status}`);
    }

    // Сохраняем новые заголовки авторизации (Medtronic сейчас часто использует Bearer токены вместо кук)
    const token = authResponse.headers.get('Authorization') || authResponse.headers.get('x-auth-token');
    const setCookie = authResponse.headers.get('set-cookie') || '';
    
    // Шаг Б: Запрос сахаров с нового эндпоинта
    const dataUrl = `https://carelink.minimed.eu/api/patients/me/glucose`;
    
    const dataResponse = await fetch(dataUrl, {
      headers: {
        'Authorization': token,
        'Cookie': setCookie,
        'Accept': 'application/json'
      }
    });

    if (!dataResponse.ok) {
      throw new Error(`Не удалось получить данные с нового API: ${dataResponse.status}`);
    }

    const carelinkData = await dataResponse.json();
    // Извлекаем массив сахаров (в новом API это обычно glucoseEntries или sgs)
    const sgs = carelinkData.glucoseEntries || carelinkData.sgs || [];
    
    if (sgs.length === 0) {
      console.log('Новых сахаров в системе нет.');
      return;
    }

    console.log(`Успешно получено ${sgs.length} записей. Отправка в Nightscout...`);

    // Шаг В: Перенос в Nightscout
    const entries = sgs.map(item => ({
      sgv: item.value || item.glucose,
      date: new Date(item.datetime || item.timestamp).getTime(),
      dateString: item.datetime || item.timestamp,
      direction: item.trend || 'NONE',
      device: 'CareLinkNewAPI',
      type: 'sgv'
    }));

    const nsResponse = await fetch(`${NIGHTSCOUT_URL}/api/v1/entries`, {
      method: 'POST',
      headers: {
        'API-SECRET': NIGHTSCOUT_API_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entries)
    });

    if (nsResponse.ok) {
      console.log('Синхронизация успешно выполнена!');
    } else {
      console.error(`Nightscout выдал ошибку: ${nsResponse.status}`);
    }

  } catch (error) {
    console.error('Ошибка моста:', error.message);
  }
}

// Запуск сервера заглушки
app.get('/', (req, res) => res.send('Новый автономный мост запущен!'));
app.listen(process.env.PORT || 10000, () => {
  console.log('Сервер запущен и слушает порт 10000');
  syncData();
  setInterval(syncData, 5 * 60 * 1000);
});
