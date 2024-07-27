const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron'); // For scheduling reminders

const WEATHER_API_KEY = 'dc4c37f61a4d0973c247f29387986b4b';
const CURRENCY_API_KEY = '642bddca5af9a1688beaa4c1'; // Replace with your currency conversion API key

const bot = new TelegramBot('7275898085:AAHXu_aYLU5Q4yKQR1hdHBxhYITP1-DqXcU', { polling: true }); // Replace with your bot token

// Store reminders
const reminders = {}; // Format: { chatId: [ { time: 'HH:MM', message: 'Reminder message' }, ... ] }

// Commands
const COMMANDS = {
    START: '/start',
    WEATHER: '/weather',
    REMIND: '/remind',
    HELP: '/help',
    CURRENCY: '/currency',
    HELPLINE: '/helpline'
};

// Function to get weather details
const getWeather = async (location) => {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: location,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });
        const data = response.data;
        return `Weather in ${data.name}:\nTemperature: ${data.main.temp}°C\nWeather: ${data.weather[0].description}\nHumidity: ${data.main.humidity}%`;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return 'Error fetching weather data. Please try again later.';
    }
};

// Function to get currency conversion
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${CURRENCY_API_KEY}/latest/${fromCurrency}`);
        const rate = response.data.conversion_rates[toCurrency];
        const convertedAmount = (amount * rate).toFixed(2);
        return `${amount} ${fromCurrency} is equal to ${convertedAmount} ${toCurrency}.`;
    } catch (error) {
        console.error('Error fetching currency conversion:', error);
        return 'Error fetching currency conversion. Please try again later.';
    }
};

// Function to translate text using API Layer
const translateText = async (text, targetLanguage) => {
    try {
        const response = await axios.post(`https://api.apilayer.com/translate`, null, {
            params: {
                q: text,
                target: targetLanguage
            },
            headers: {
                'Authorization': `Bearer ${API_LAYER_TRANSLATION_API_KEY}`
            }
        });
        return response.data.translations[0].translatedText;
    } catch (error) {
        console.error('Error translating text:', error);
        return 'Error translating text. Please try again later.';
    }
};

// Function to set a reminder
const setReminder = (chatId, time, message) => {
    if (!reminders[chatId]) reminders[chatId] = [];
    reminders[chatId].push({ time, message });
    bot.sendMessage(chatId, `Reminder set for ${time}: ${message}`);
};

// Function to check reminders
const checkReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    console.log(`Checking reminders at ${currentTime}`);
    for (const [chatId, remindersList] of Object.entries(reminders)) {
        reminders[chatId] = remindersList.filter(reminder => {
            if (reminder.time === currentTime) {
                bot.sendMessage(chatId, `Reminder: ${reminder.message}`);
                return false;
            }
            return true;
        });
    }
};

// Schedule to check reminders every minute
cron.schedule('* * * * *', checkReminders);

// Handle /start command
bot.onText(new RegExp(`^${COMMANDS.START}$`), (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to the Bot! Use the following commands:\n' +
        `/weather [location] - Get weather details for a location\n` +
        `/currency [amount] [fromCurrency] [toCurrency] - Convert currency\n` +
        `/remind [time] [message] - Set a reminder (time in HH:MM format)\n` +
        `/helpline - Get helpline numbers\n` +
        `/help - Display this help message`);
});

// Handle /weather command
bot.onText(new RegExp(`^${COMMANDS.WEATHER} (.+)$`), async (msg, match) => {
    const chatId = msg.chat.id;
    const location = match[1];
    const weatherInfo = await getWeather(location);
    bot.sendMessage(chatId, weatherInfo);
});

// Handle /currency command
bot.onText(new RegExp(`^${COMMANDS.CURRENCY} (\\d+) ([A-Z]{3}) ([A-Z]{3})$`), async (msg, match) => {
    const chatId = msg.chat.id;
    const amount = parseFloat(match[1]);
    const fromCurrency = match[2];
    const toCurrency = match[3];
    const conversionInfo = await convertCurrency(amount, fromCurrency, toCurrency);
    bot.sendMessage(chatId, conversionInfo);
});

// Handle /remind command
bot.onText(new RegExp(`^${COMMANDS.REMIND} (\\d{2}:\\d{2}) (.+)$`), (msg, match) => {
    const chatId = msg.chat.id;
    const time = match[1];
    const message = match[2];
    setReminder(chatId, time, message);
});

// Handle /helpline command
bot.onText(new RegExp(`^${COMMANDS.HELPLINE}$`), (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Helpline numbers:\n' +
        'Emergency: 112\n' +
        'Police: 100\n' +
        'Fire: 101\n' +
        'Ambulance: 102\n' +
        'Women Helpline: 181\n' +
        'Child Helpline: 1098');
});

// Handle /help command
bot.onText(new RegExp(`^${COMMANDS.HELP}$`), (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Help: Use the following commands:\n' +
        `/weather [location] - Get weather details\n` +
        `/currency [amount] [fromCurrency] [toCurrency] - Convert currency\n` +
        `/remind [time] [message] - Set a reminder\n` +
        `/helpline - Get helpline numbers\n` +
        `/help - Display this help message`);
});
