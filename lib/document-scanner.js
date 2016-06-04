var path = require('path');
var util = require('util');
var kue = require('kue');
var EventEmitter = require('events').EventEmitter;

var pdfText = require('pdf-text');
var chokidar = require('chokidar');
var moment = require('moment');
var _ = require('lodash');

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

/**
 * Document Scanner
 * @param options Options
 * @constructor
 */
function DocumentScanner(options) {

    // Defaults
    var defaults = {
    };

    this.options = _.merge({}, defaults, options);

    this.interact = options.interact;
    this.jobs = kue.createQueue();

    EventEmitter.call(this);
}

util.inherits(DocumentScanner, EventEmitter);

/**
 * Gets the document type based on a filepath
 * @param docPath Path to the document inside the basepath
 * @param basePath Root folder of the document
 * @returns {String} Type of document
 */
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

/**
 * Processes the content of a document and returns harvested data from it
 * @param docPath Path to the document
 * @param cb Callback
 */
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

/**
 * Watches the inbox for file additions
 */
DocumentScanner.prototype.watch = function () {
    var watcher = chokidar.watch(this.options.paths.inbox + '**/*', {ignored: /[\/\\]\./, persistent: true});

    watcher.on('add', function(docPath) {

        processContent(docPath, function(data) {

            this.emit('new', {
                type: getDocumentType(docPath, this.options.paths.inbox),
                path: docPath,
                name: path.basename(docPath, path.extname(docPath)),
                ext: path.extname(docPath),
                data: data
            })

        }.bind(this));

    }.bind(this));
};

/**
 * Starts the document scanner
 */
DocumentScanner.prototype.start = function() {
    this.watch();

    this.on('new', function(document) {
        //this.interact.documents.newDocument(document);

        this.jobs.create('new_document', {
            document: document
        }).save();

    }.bind(this));
};

module.exports = DocumentScanner;
