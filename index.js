const token = "6535928824:AAHqQbIZtbvMJmmDnTSSxMnQlhUrp_qgfi0";
const TelegramApi = require('node-telegram-bot-api');
const bot = new TelegramApi(token, { polling: true });

const answerOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Yes', callback_data: 'Yes' }, { text: 'Not sure', callback_data: 'Not sure' }, { text: 'No', callback_data: 'No' }],
        ],
    }),
};

const profileQuestions = ["Do you love animals?", "Do you think that you are positive person?", "Is family important to you?"];
const choiceQuestions = ["What is A option?", "What is B option?"];
const needAdviceQuestions = ["What do you need advice with?", "Why is it important for you?"];
const userProfile = {};
const choiceInfo = {};
const adviceInfo = {};

bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, `Welcome ${msg.chat.first_name} ${msg.chat.last_name}`);
        await bot.sendSticker(chatId, "https://tlgrm.eu/_/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/1.webp");
    } else if (text === '/create_profile') {
        await handleQuestionCommand(chatId, profileQuestions, userProfile, 'profile', true);
    } else if (text === '/make_choice') {
        if (isProfileComplete(chatId)) {
            await handleQuestionCommand(chatId, choiceQuestions, choiceInfo, 'choice', false);
        } else {
            await bot.sendMessage(chatId, "Sorry, but you need to fill your profile first. Please, use `/create_profile` command");
        }
    } else if (text === '/need_advice') {
        if (isProfileComplete(chatId)) {
            await handleQuestionCommand(chatId, needAdviceQuestions, adviceInfo, 'advice', false);
        } else {
            await bot.sendMessage(chatId, "Sorry, but you need to fill your profile first. Please, use `/create_profile` command");
        }
    } else if (text === '/show_info') {
        await showInfo(chatId);
    }
});

async function handleQuestionCommand(chatId, questions, infoObject, type, useButtons) {
    infoObject[chatId] = {};

    for (let question of questions) {
        if (useButtons) {
            await bot.sendMessage(chatId, question, answerOptions)
        } else {
            await bot.sendMessage(chatId, question)
        }
        await waitForUserResponse(chatId, question, infoObject, useButtons);
    }

    await bot.sendMessage(chatId, `Your ${type} answers have been saved.`);
}

async function showInfo(chatId) {
    let infoMessage = 'Your information:\n';

    // Show user profile info
    if (userProfile[chatId] && Object.keys(userProfile[chatId]).length > 0) {
        infoMessage += '\nProfile:\n';
        for (let question in userProfile[chatId]) {
            infoMessage += `${question} ${userProfile[chatId][question]}\n`;
        }
    } else {
        infoMessage += '\nNo profile information.\n';
    }
    
    // Show choice info
    if (choiceInfo[chatId] && Object.keys(choiceInfo[chatId]).length > 0) {
        infoMessage += '\nChoices:\n';
        for (let question in choiceInfo[chatId]) {
            infoMessage += `${question} ${choiceInfo[chatId][question]}\n`;
        }
    } else {
        infoMessage += '\nNo choices made.\n';
    }

    // Show advice info
    if (adviceInfo[chatId] && Object.keys(adviceInfo[chatId]).length > 0) {
        infoMessage += '\nAdvice:\n';
        for (let question in adviceInfo[chatId]) {
            infoMessage += `${question} ${adviceInfo[chatId][question]}\n`;
        }
    } else {
        infoMessage += '\nNo advice given.\n';
    }

    await bot.sendMessage(chatId, infoMessage);
}

function waitForUserResponse(chatId, question, infoObject, useButtons) {
    return new Promise(resolve => {
        if (useButtons) {
            const callbackQueryHandler = (callbackQuery) => {
                if (callbackQuery.message.chat.id === chatId) {
                    bot.removeListener('callback_query', callbackQueryHandler);
                    infoObject[chatId][question] = callbackQuery.data;
                    resolve();
                }
            };
            bot.on('callback_query', callbackQueryHandler);
        } else {
            const messageHandler = (msg) => {
                if (msg.chat.id === chatId && !msg.text.startsWith('/')) {
                    bot.removeListener('message', messageHandler);
                    infoObject[chatId][question] = msg.text;
                    resolve();
                }
            };
            bot.on('message', messageHandler);
        }
    });
}

function isProfileComplete(chatId) {
    const profile = userProfile[chatId];
    if (!profile) return false;

    return profileQuestions.every(question => profile[question]);
}

bot.setMyCommands([
    {command: '/start', description: 'Welcome functionality'},
    {command: '/create_profile', description: 'Needed to start the magic'},
    {command: '/make_choice', description: 'Helps to make some choice'},
    {command: '/need_advice', description: 'Need advice? Ask here!'},
    {command: '/show_info', description: 'Show the information you provided'}
]);

bot.on('polling_error', (error) => {
    console.log(error);
});