var _ = require('lodash');

var Interact = require('./interact');
var DocumentScanner = require('./document-scanner');

/**
 * HomeBot Main Module
 * @param options Options object
 * @constructor
 */
function HomeBot(options) {

    var defaults = {
        persona: 'bb8'
    };

    // Merge defaults with passed objects
    this.options = _.merge({}, defaults, options);

    // Load Persona
    this.persona = require('../personas/' + this.options.persona);

    // Create the interact client
    var interact = Interact.createClient({
        slackToken: options.slack.token,
        witToken: options.wit.token,
        persona: this.persona
    });

    // Create the document scanner
    var documentScanner = new DocumentScanner({
        interact: interact,
        paths: options.documents
    });

    // Start the interaction service
    interact.start(function () {
        // Start listening for scanned documents
        documentScanner.start();
    });

}

module.exports = HomeBot;
