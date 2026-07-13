const axios = require('axios');

// Шпион для глобального axios
axios.interceptors.request.use(req => {
    console.log(`[HTTP ЗАПРОС] ${req.method.toUpperCase()} ${req.baseURL || ''}${req.url || ''}`);
    return req;
});
axios.interceptors.response.use(res => res, err => {
    if (err.config) {
        console.error(`[HTTP ОШИБКА ${err.response?.status}] на URL: ${err.config.baseURL || ''}${err.config.url || ''}`);
    }
    return Promise.reject(err);
});

// Шпион для изолированных инстансов axios.create()
const originalCreate = axios.create;
axios.create = function(config) {
    const instance = originalCreate.call(this, config);
    instance.interceptors.request.use(req => {
        console.log(`[HTTP ЗАПРОС (create)] ${req.method.toUpperCase()} ${req.baseURL || ''}${req.url || ''}`);
        return req;
    });
    instance.interceptors.response.use(res => res, err => {
        if (err.config) {
            console.error(`[HTTP ОШИБКА ${err.response?.status} (create)] на URL: ${err.config.baseURL || ''}${err.config.url || ''}`);
        }
        return Promise.reject(err);
    });
    return instance;
};

// Перехватываем все вызовы axios глобально
axios.interceptors.request.use((config) => {
  if (config.url) config.url = patchUrl(config.url);
  if (config.baseURL) config.baseURL = patchUrl(config.baseURL);
  return config;
}, (error) => Promise.reject(error));

const http = require('http');
const bridge = require('minimed-connect-to-nightscout');

const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(port, '0.0.0.0', () => {
  console.log(`[Веб-сервер] Активен на порту ${port}`);
});

if (process.env.NIGHTSCOUT_API_SECRET && !process.env.API_SECRET) {
  process.env.API_SECRET = process.env.NIGHTSCOUT_API_SECRET;
}

const config = {
  username: process.env.CARELINK_USERNAME,
  password: process.env.CARELINK_PASSWORD,
  countrycode: process.env.CARELINK_COUNTRY || process.env.CARELINK_COUNTRY_CODE || 'pl', 
  region: process.env.CARELINK_REGION || 'EU',
  nightscout: process.env.NIGHTSCOUT_HOST,
  secret: process.env.API_SECRET
};

console.log("[Мост] Инициализация системы обхода 404 URL...");

const clientFactory = typeof bridge.carelink === 'function' ? bridge.carelink : Object.values(bridge.carelink).find(f => typeof f === 'function');
const uploadNightscout = typeof bridge.nightscout === 'function' ? bridge.nightscout : (bridge.nightscout.upload || bridge.nightscout.send || Object.values(bridge.nightscout).find(f => typeof f === 'function'));

async function syncData() {
  console.log(`[${new Date().toISOString()}] ==> Старт синхронизации...`);
  try {
    console.log("[Мост] Шаг 1А: Инициализация клиента CareLink...");
    const client = await clientFactory(config);
    
    // --- ДИАГНОСТИКА И КОРРЕКЦИЯ СТАРЫХ URL (Манкипатчинг) ---
    if (client) {
      // Ищем скрытые или внутренние настройки хоста в инстансе клиента
      const hostKey = Object.keys(client).find(k => k.toLowerCase().includes('host') || k.toLowerCase().includes('url'));
      if (hostKey) {
        console.log(`[Диагностика URL] Обнаружен параметр ${hostKey}: ${client[hostKey]}`);
      }
      
      // Патчим распространенную проблему старых версий для региона EU
      if (client.host && client.host.includes('mfa.carelink.minimed.eu')) {
        console.log("[Патч] Замена устаревшего хоста mfa.carelink на стандартный carelink.minimed.eu");
        client.host = 'carelink.minimed.eu';
      }
    }
    // --------------------------------------------------------

    let rawData;
    if (client && typeof client.fetch === 'function') {
      console.log("[Мост] Шаг 1Б: Запрос данных через колбэк...");
      
      rawData = await new Promise((resolve, reject) => {
        client.fetch((err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });
    } else {
      console.log("[Мост] Данные получены напрямую из фабрики.");
      rawData = client;
    }
    
    if (!rawData) {
      console.log("[Мост] Ответ от CareLink пуст.");
      return;
    }

    console.log("[Мост] Шаг 2: Трансформация данных...");
    const transformedData = bridge.transform(rawData);
    const filteredData = bridge.filter ? bridge.filter(transformedData) : transformedData;

    console.log("[Мост] Шаг 3: Отправка в Nightscout...");
    
    if (typeof uploadNightscout === 'function') {
      await new Promise((resolve, reject) => {
        const result = uploadNightscout(filteredData, config, (err) => {
          if (err) return reject(err);
          resolve();
        });
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        }
      });
    }
    
    console.log("[Успех 🎉] Данные сахара успешно доставлены в Nightscout!");

  } catch (error) {
    console.error("[Ошибка конвейера]:", error.message || error);
    if (error.stack) {
      console.log("Подробный стек ошибки для анализа:");
      console.log(error.stack);
    }
  }
}

if (clientFactory && uploadNightscout) {
  syncData();
  setInterval(syncData, 300000); // Каждые 5 минут
} else {
  console.error("[Критическая ошибка] Не удалось настроить функции моста.");
}
