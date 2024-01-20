const TelegramApi = require('node-telegram-bot-api')

const token = "6535928824:AAHqQbIZtbvMJmmDnTSSxMnQlhUrp_qgfi0"

const bot = new TelegramApi(token, {polling: true})

const answerOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Yes', callback_data: 'Yes'}, {text: 'Not sure', callback_data: 'Not sure'}, {text: 'No', callback_data: 'No'}],
        ]
    })
}

const booleanOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Yes', callback_data: 'Yes'}, {text: 'No', callback_data: 'No'}],
        ]
    })
}

const profileQuestions = [
    "Do you love animals?",
    "Do you think that you are positive person?",
    "Is family important to you?"
]

const choiceQuestions = [
    "What is A option?",
    "What is B option?"
]

const needAdviceQuestions = [
    "What do you need advice with?",
    "Why is it important for you?"
]

const userInfo = {}
const adviceInfo = {}
const choiceInfo = {}

const start = async () => {
    bot.setMyCommands([
        {command: '/start', description: 'Wellcome functionality'},
        {command: '/info', description: 'Some info'},
        {command: '/profile', description: "Create profile"},
        {command: '/make_choice', description: "Helps to make some choice"},
        {command: '/need_advice', description: "Provide an advice for you"},
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if(text === '/start') {
            bot.sendMessage(chatId, `Wellcome ${msg.chat.first_name}  ${msg.chat.last_name}`);
            bot.sendSticker(chatId, "https://tlgrm.eu/_/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/1.webp");
        }

        if(text === '/info') {
            bot.sendMessage(chatId, 
                `User info is ${JSON.stringify(userInfo)}
Choice info is ${JSON.stringify(choiceInfo)}
Advice info is ${JSON.stringify(adviceInfo)}`);
        }

        if(text === '/profile') {
            if (userInfo[chatId] && Object.keys(userInfo[chatId]).length > 0) {
                await bot.sendMessage(chatId, "We already have your profile data. Do you want to re-write it?", booleanOptions);
            } else {
                await createProfile(chatId);
            }
        }
    })

    bot.on('callback_query', async msg => {
        const chatId = msg.message.chat.id;
        const data = msg.data;
    
        if (msg.message.text === "We already have your profile data. Do you want to re-write it?") {
            if (data === 'Yes') {
                await createProfile(chatId);
            } else {
                await bot.sendMessage(chatId, "We received your answer. Thanks!");
            }
        } else {
            const question = msg.message.text;
            userInfo[chatId][question] = data;
        }
    });
}

async function askQuestion(chatId, question) {
    await bot.sendMessage(chatId, question, answerOptions);
    return new Promise(resolve => {
        bot.once('callback_query', msg => {
            if (msg.message.chat.id === chatId) {
                resolve();
            }
        });
    });
}

async function createProfile(chatId) {
    userInfo[chatId] = {};
    for (let i = 0; i < profileQuestions.length; i++) {
        await askQuestion(chatId, profileQuestions[i]);
    }
    await bot.sendMessage(chatId, "Thanks! Your answers were saved");
}

start()