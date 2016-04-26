var fs = require('fs');

var Documents = exports.documents = function (Client) {
    this.client = Client;

    return this;
};

function getDateMessage(dates) {
    var message;

    if (dates.length === 0) {
        message = 'I can\'t detect any dates in this document so I\'m assuming its from today. If not, let me know the correct date!'
    } else if (dates.length === 1) {
        message = 'I\'ve found a date in this document (' + dates[0] + ') so I\'m assuming that is the correct date for the file. If this is not correct, let me know the correct date! :)';
    } else if (dates.length > 1) {
        message = 'I\'ve found multiple dates in this document, which one do you want me to use?';
    }

    return message;
}

Documents.prototype.newDocument = function(document) {

    this.client.web.chat.postMessage('C104MCRL6', 'Woah, i\'ve found a new ' + document.type + ' in my inbox', {
        as_user: true
    }, function() {});

    this.client.web.files.upload({
        filename: document.path.split('/')[document.path.split('/').length],
        title: document.path.split('/')[document.path.split('/').length],
        file: fs.createReadStream(document.path),
        filetype: 'pdf',
        channels: 'C104MCRL6',
        initial_comment: getDateMessage(document.data.dates)
    }, function(err, data) {
        console.log('err', err);
        console.log('data', data);

    });

};
