var Interact = require('./interact');
var DocumentScanner = require('./document-scanner');

function HomeBot(config) {

    this.config = config;

    var interact = Interact.createClient({
        slackToken: config.slack.token,
        witToken: config.wit.token
    });

    var documentScanner = new DocumentScanner({
        interact: interact
    });

    // Start the interaction service
    interact.start(function () {
        // Start listening for scanned documents
        documentScanner.start();
    });

}

module.exports = HomeBot;
