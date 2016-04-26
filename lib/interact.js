var Botkit = require('botkit');
var Witbot = require('witbot');
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

    // self.web = new WebClient(slackToken);
    // self.rtm = new RtmClient(slackToken);

    // Defaults
    var defaults = {
    };

    // Merge defaults with passed objects
    this.options = _.merge({}, defaults, options);

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

Interact.prototype.start = function() {
    var self = this;

    this.controller = Botkit.slackbot({
        debug: false
    });

    this.bot = this.controller.spawn({
        token: this.options.slackToken
    }).startRTM();

    this.witbot = Witbot(this.options.witToken);

    topics.forEach(function (topic) {
        if (self[topic.ref.toLowerCase()].init) {
            self[topic.ref.toLowerCase()].init();
        }
    });
};

/**
 * Interaction client constuctor
 * @param  {Object} options  Options object
 * @return {Interact}          Returns a new instance of the Client object
 */
module.exports.createClient = function(options) {
    return new Interact(options);
};
