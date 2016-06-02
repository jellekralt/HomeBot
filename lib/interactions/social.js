var fs = require('fs');

/**
 * Social Interactions
 * @type {exports.social}
 */
var Social = exports.social = function (Client) {
    this.client = Client;
    this.persona = this.client.options.persona;
    this.interaction = this.persona.interaction;

    return this;
};

/**
 * Module initializer
 */
Social.prototype.init = function() {
    this.setListeners();
};

/**
 * Creates listeners
 */
Social.prototype.setListeners = function() {

    // Reply to a greet
    this.client.controller.hears(['hi', 'hey', 'hoi', 'yo', 'yoo*'], 'message_received,direct_mention,mention', function(bot, message) {
        bot.reply(message, this.interaction.social.greeting);
    }.bind(this));

    // Reply to a user asking confirmation
    this.client.controller.hears(['toch', 'wat vind jij', 'wat jij'], 'message_received,direct_mention,mention', function(bot, message) {
        bot.reply(message, this.interaction.social.confirmation);
    }.bind(this));

};
