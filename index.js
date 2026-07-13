const express = require('express');
const app = express();

// 1. НАСТРОЙКИ (Заполните в кавычках)
const CARELINK_USERNAME = "NIKITA_khali";
const CARELINK_PASSWORD = "Dilutthdhgd_6767";
const NIGHTSCOUT_URL = "https://huesosminimed.onrender.com"; 
const NIGHTSCOUT_API_SECRET = "ALEKSEYNAVALNIY1487";

async function syncData() {
  try {
    console.log(`[${new Date().toISOString()}] Автономный запрос в CareLink...`);
    
    // Шаг A: Авторизация в CareLink (Европа)
    const loginUrl = 'https://carelink.minimed.eu/bl/cdm/login';
    const authResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: CARELINK_USERNAME,
        password: CARELINK_PASSWORD,
        role: 'PATIENT'
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Ошибка авторизации CareLink: ${authResponse.status}`);
    }

    // Сохраняем полученные куки/токены авторизации
    const authHeaders = authResponse.headers;
    const setCookie = authHeaders.get('set-cookie') || '';
    
    // Шаг Б: Получение последних данных сахара
    // Запрашиваем данные за последние 20 минут
    const fromDate = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const dataUrl = `https://carelink.minimed.eu/bl/cdm/data?fromDate=${fromDate}`;
    
    const dataResponse = await fetch(dataUrl, {
      headers: {
        'Cookie': setCookie,
        'Accept': 'application/json'
      }
    });

    if (!dataResponse.ok) {
      throw new Error(`Не удалось получить данные: ${dataResponse.status}`);
    }

    const carelinkData = await dataResponse.json();
    
    // Проверяем, есть ли данные ГК (обычно в массиве sgs или аналогичном)
    const sgs = carelinkData.sgs || [];
    if (sgs.length === 0) {
      console.log('Новых сахаров в CareLink пока нет.');
      return;
    }

    console.log(`Найдено записей: ${sgs.length}. Отправка в Nightscout...`);

    // Шаг В: Форматирование для Nightscout
    const entries = sgs.map(item => ({
      sgv: item.value,
      date: new Date(item.datetime).getTime(),
      dateString: item.datetime,
      direction: item.trend || 'NONE',
      device: 'CareLinkAutonomous',
      type: 'sgv'
    }));

    // Шаг Г: Отправка в ваш Nightscout
    const nsResponse = await fetch(`${NIGHTSCOUT_URL}/api/v1/entries`, {
      method: 'POST',
      headers: {
        'API-SECRET': NIGHTSCOUT_API_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entries)
    });

    if (nsResponse.ok) {
      console.log('Синхронизация с Nightscout успешно выполнена!');
    } else {
      console.error(`Nightscout вернул ошибку: ${nsResponse.status}`);
    }

  } catch (error) {
    console.error('Ошибка в процессе работы моста:', error.message);
  }
}

// Запуск веб-сервера для Render
app.get('/', (req, res) => res.send('Автономный мост CareLink запущен!'));
app.listen(process.env.PORT || 10000, () => {
  console.log('Сервер-заглушка запущен на порту 10000');
  
  // Первая синхронизация при старте
  syncData();
  // Повтор каждые 5 минут
  setInterval(syncData, 5 * 60 * 1000);
});
