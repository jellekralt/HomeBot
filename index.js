var Interact = require('./lib/interact');
var DocumentScanner = require('./lib/document-scanner');

var config = require('./config');

var interact = Interact.createClient({
    slackToken: config.slack.token,
    witToken: config.wit.token
});

var documentScanner = new DocumentScanner();

// Start the interaction service
interact.start();
// Start listening for scanned documents
documentScanner.start();
