var path = require('path');
var util = require('util');
var kue = require('kue');
var EventEmitter = require('events').EventEmitter;

var pdfText = require('pdf-text');
var chokidar = require('chokidar');
var moment = require('moment');

var config = require('../config');

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

function DocumentScanner(options) {
    this.interact = options.interact;
    this.jobs = kue.createQueue();

    EventEmitter.call(this);
}

util.inherits(DocumentScanner, EventEmitter);

function getDocumentType(docPath, basePath) {
    var subFolder = docPath.replace(basePath, '').split('/')[0];

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

function processContent(docPath, cb) {

    pdfText(docPath, function(err, chunks) {
        var dates = chunks.map(function(chunk) {
            var date = moment(chunk, DATE_FORMATS, true);
            return date.isValid() && date.format('YYYY-MM-DD');
        }).filter(function(date) {
            return date !== false && date !== null;
        });

        cb({
            dates: dates
        })
    })

}

DocumentScanner.prototype.watch = function (name) {
    var watcher = chokidar.watch(config.documents.inbox + '**/*', {ignored: /[\/\\]\./, persistent: true});

    watcher.on('add', function(docPath) {

        processContent(docPath, function(data) {

            this.emit('new', {
                type: getDocumentType(docPath, config.documents.inbox),
                path: docPath,
                name: path.basename(docPath, path.extname(docPath)),
                ext: path.extname(docPath),
                data: data
            })

        }.bind(this));

    }.bind(this));
};

DocumentScanner.prototype.start = function() {
    this.watch();

    this.on('new', function(document) {
        // this.interact.documents.newDocument(document);

        this.jobs.create('new_document', {
            document: document
        }).save();

    }.bind(this));
};

module.exports = DocumentScanner;
