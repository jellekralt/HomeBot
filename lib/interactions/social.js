var fs = require('fs');

var Social = exports.social = function (Client) {
    this.client = Client;

    return this;
};



Social.prototype.init = function(document) {
    console.log('init!');

    this.handleListeners();
};

Social.prototype.handleListeners = function() {
    /**
     * Respond to a 'hello'
     */

    this.client.controller.hears(['.*'], 'direct_message,direct_mention,mention', function(bot, message) {

        var wit = this.client.witbot.process(message.text, bot, message);

        console.log('message.text', message.text);

        wit.hears('weer', 0.53, function (bot, message, outcome) {
            console.log('message', message);

            // bot.startConversation(message, function (_, convo) {
            //     convo.say('Hello!')
            //     convo.ask('How are you?', function (response, convo) {
            //         witbot.process(response.text)
            //             .hears('good', 0.5, function (outcome) {
            //                 convo.say('I am so glad to hear it!')
            //                 convo.next()
            //             })
            //             .hears('bad', 0.5, function (outcome) {
            //                 convo.say('I\'m sorry, that is terrible')
            //                 convo.next()
            //             })
            //             .otherwise(function (outcome) {
            //                 convo.say('I\'m cofused')
            //                 convo.repeat()
            //                 convo.next()
            //             })
            //     })
            // })
        });

        wit.otherwise(function (bot, message) {
            console.log('message', message);
        });

        // console.log('asdfasdfadsfas');
        // bot.reply('Hi there, good to see you!');

        // bot.api.reactions.add({
        //     timestamp: message.ts,
        //     channel: message.channel,
        //     name: 'robot_face',
        // }, function(err, res) {
        //     if (err) {
        //         bot.botkit.log('Failed to add emoji reaction :(', err);
        //     }
        // });
        //
        // this.client.controller.storage.users.get(message.user, function(err, user) {
        //     if (user && user.name) {
        //         bot.reply(message, 'Hello ' + user.name + '!!');
        //     } else {
        //         bot.reply(message, 'Hello.');
        //     }
        // });

    }.bind(this));
};
