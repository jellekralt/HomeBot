var Botkit = require('botkit');
//var WebClient = require('@slack/client').WebClient;

var _ = require('lodash');

var topics = [
    { ref: 'documents', file: 'document-scanner' },
    { ref: 'social', file: 'social' }
];

/**
 * Interaction client
 * @param  {Object} options  Options object
 * @return {Interact}          Returns itself
 */
var Interact = function(options) {
    var self = this;

    // Defaults
    var defaults = {
    };

    // Merge defaults with passed objects
    this.options = _.merge({}, defaults, options);

    // Load all topics
    topics.forEach(function (topic) {
        try {
            // Try to require the service file
            exports[topic.ref] = require('./interactions/' + topic.file.toLowerCase())[topic.ref];
            self[topic.ref.toLowerCase()] = new exports[topic.ref](self);
        } catch (e) {
            // Cant be required, file probably doesn't exist
            console.log('Require error: ', e);
        }
    });
};

/**
 * Starts the interaction
 * @param {Function} cb Callback
 */
Interact.prototype.start = function(cb) {
    var self = this;

    // Create Slack Botkit client
    this.controller = Botkit.slackbot({
        debug: false
    });

    // Start Botkit
    this.bot = this.controller.spawn({
        token: this.options.slackToken
    }).startRTM(function() {
        // Loop all topics and check if it can be initialized
        topics.forEach(function (topic) {
            if (self[topic.ref.toLowerCase()].init) {
                self[topic.ref.toLowerCase()].init();
            }
        });

        cb();
    }.bind(this));

    // Configure utterances
    this.bot.utterances = {
        yes: '^(yes|yea|yup|yep|ok|ja|klopt|jup|jawel|zeker)',
        no: '^(nee|nope|neuh|no)'
    };

};

/**
 * Interaction client constuctor
 * @param  {Object} options  Options object
 * @return {Interact}          Returns a new instance of the Client object
 */
module.exports.createClient = function(options) {
    return new Interact(options);
};
