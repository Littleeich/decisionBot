
const { OpenAI } = require("openai");
const TelegramApi = require('node-telegram-bot-api');
const { profileQuestions, choiceQuestions, needAdviceQuestions } = require('./questions');
const bot = new TelegramApi(token, { polling: true });

const openai = new OpenAI({
    apiKey: openAIKey
});

const answerOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Never', callback_data: 'Never' }, { text: 'Sometimes', callback_data: 'Sometimes' }, { text: 'Often', callback_data: 'Often' }],
        ],
    }),
};

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
            await speekWithGPT(chatId, 'choice')
        } else {
            await bot.sendMessage(chatId, "Sorry, but you need to fill your profile first. Please, use `/create_profile` command");
        }
    } else if (text === '/need_advice') {
        if (isProfileComplete(chatId)) {
            await handleQuestionCommand(chatId, needAdviceQuestions, adviceInfo, 'advice', false);
            await speekWithGPT(chatId, 'advice')
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

function generateChatGptMessage(chatId, type) {
    let message = "Please, act as the closest and kindest friend of a person who ";

    for (const question in userProfile[chatId]) {
        const answer = userProfile[chatId][question];
        const modifiedQuestion = question.replace("I", answer);
        message += modifiedQuestion + " ";
    }

    if (type === 'choice') {
        message += `Please, helpfully answer ${choiceInfo[chatId][choiceQuestions[0]]} by selecting only one option from ${choiceInfo[chatId][choiceQuestions[1]]} and ${choiceInfo[chatId][choiceQuestions[2]]}. `
        message += `Acting as this friend, please, select only one option to answer a question. Please, keep the answer in 1-2 sentences.`;
    } else if (type === 'advice') {
        const adviceResponses = needAdviceQuestions.map(question => adviceInfo[chatId][question]);
        message += `Acting as this friend, please, give a piece of advice for the situation about which you certainly know that ${adviceResponses.join(" and ")}? Please, keep the answer in 1-2 sentences.`;
    }

    return message;
}


async function speekWithGPT(chatId, type) {
    try {
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{role: 'system', content: generateChatGptMessage(chatId, type)}]
        });
        console.log(generateChatGptMessage(chatId, type));
        // console.log(gptResponse.choices[0])
        await bot.sendMessage(chatId, gptResponse.choices[0].message.content);
    } catch (error) {
        console.error("Error querying OpenAI:", error);
        await bot.sendMessage(chatId, "There was an error processing your request.");
    }
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