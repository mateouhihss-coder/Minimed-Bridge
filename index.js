const { CareLinkClient } = require('@nightscout-connect/carelink');

// Укажите ваши данные от CareLink
const CARELINK_USERNAME = "ВАШ_ЛОГИН";
const CARELINK_PASSWORD = "ВАШ_ПАРОЛЬ";

async function loginAndGetToken() {
  try {
    console.log("Попытка прямой авторизации в CareLink...");
    
    const client = new CareLinkClient({
      username: CARELINK_USERNAME,
      password: CARELINK_PASSWORD,
      region: 'EU'
    });

    // Пытаемся вызвать метод получения данных, который инициирует вход
    await client.getLastGlucoseData();
    
    // Если вход успешен, библиотека сохранит токен внутри клиента
    const token = client.getRefreshToken(); 
    
    console.log("========================================");
    console.log("УРА! ТОКЕН ПОЛУЧЕН:");
    console.log(token);
    console.log("========================================");
    
  } catch (error) {
    console.error("Не удалось войти напрямую:", error.message);
    console.log("Скорее всего, сработала CAPTCHA. Нужен перехват ссылки или куки.");
  }
}

loginAndGetToken();
