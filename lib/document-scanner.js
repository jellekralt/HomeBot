var path = require('path');
var fs = require('fs-extra');
var util = require('util');
var kue = require('kue');
var async = require('async');
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
                folder: path.dirname(docPath),
                name: path.basename(docPath, path.extname(docPath)),
                ext: path.extname(docPath),
                data: data
            })

        }.bind(this));

    }.bind(this));
};

DocumentScanner.prototype.process = function(document) {
    var sourcePath = document.path;
    var targetPath = this.options.paths.storage + '/' + this.options.paths[document.type] + '/' + document.data.transformations.fullName;

    // Move file to correct folder
    this.moveUnique(sourcePath, targetPath);
};

DocumentScanner.prototype.moveUnique = function(source, target) {
    var count = 0;
    var parsedTarget = path.parse(target);

    async.doUntil(
        function (callback) {

            if (count !== 0) {
                target = parsedTarget.dir + '/' + parsedTarget.name + '-' + count + parsedTarget.ext;
            }

            fs.stat(target, function(err, stats) {
                callback(err, stats === undefined);
            });
        },
        function (unique) {
            if (!unique) {
                count++;
            }
            return unique;
        },
        function (err) {
            // Unique filename has been found
            fs.copy(source, target, {clobber:false}, function (err) {
                if (err) return console.error(err);
            });
        }
    );
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

    this.jobs.process('processed_document', function (job, done){
       this.process(job.data.document);
    }.bind(this));

};

module.exports = DocumentScanner;
