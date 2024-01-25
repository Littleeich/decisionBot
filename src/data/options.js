const answerOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Never', callback_data: 'Never' }, { text: 'Sometimes', callback_data: 'Sometimes' }, { text: 'Often', callback_data: 'Often' }],
        ],
    }),
};

const rateOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: '1', callback_data: '1' }, { text: '2', callback_data: '2' }, { text: '3', callback_data: '3' }, { text: '4', callback_data: '4' }, { text: '5', callback_data: '5' }],
        ],
    }),
};

module.exports = { answerOptions, rateOptions };