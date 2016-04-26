var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var pdfText = require('pdf-text');
var chokidar = require('chokidar');
var moment = require('moment');

var config = require('../config');

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

function DocumentScanner() {
    EventEmitter.call(this);
}

util.inherits(DocumentScanner, EventEmitter);

function getDocumentType(path, basePath) {
    var subFolder = path.replace(basePath, '').split('/')[0];

    switch(subFolder) {
        case 'receipts':
            return 'receipt';
            break;

        case 'documents':
            return 'document';
            break;

        default:
            return 'unknown';
            break;
    }
}

function processContent(path, cb) {

    pdfText(path, function(err, chunks) {
        var dates = chunks.filter(function(chunk) {
            return moment(chunk, DATE_FORMATS, true).isValid()
        });

        cb({
            dates: dates
        })
    })

}

DocumentScanner.prototype.watch = function (name) {
    var watcher = chokidar.watch(config.documents.inbox + '**/*', {ignored: /[\/\\]\./, persistent: true});

    watcher.on('add', function(path) {

        processContent(path, function(data) {

            this.emit('new', {
                type: getDocumentType(path, config.documents.inbox),
                path: path,
                data: data
            })

        }.bind(this));

    }.bind(this));
};

DocumentScanner.prototype.start = function() {
    this.watch();

    this.on('new', function(document) {
        console.log('document', document);
    });
};

module.exports = DocumentScanner;
