var fs = require('fs');

var Social = exports.social = function (Client) {
    this.client = Client;

    return this;
};

Social.prototype.init = function() {
    this.handleListeners();
};

Social.prototype.handleListeners = function() {

    this.fun();

};

Social.prototype.fun = function() {

    // Reply to a user asking confirmation
    this.client.controller.hears(['toch', 'wat vind jij', 'wat jij'], 'message_received,direct_mention,mention', function(bot, message) {
        bot.reply(message, 'Beep-boop!');
    });

};

