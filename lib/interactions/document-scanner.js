var fs = require('fs');
var kue = require('kue');
var moment = require('moment');

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

var Documents = exports.documents = function (Client) {
    this.client = Client;

    this.queue = kue.createQueue();

    return this;
};

function getDateMessage(dates) {
    var message;

    if (dates.length === 0) {
        message = 'Ik heb geen datums gevonden in het document, dus ik ga er van uit dat het van vandaag is, klopt dat?';
    } else if (dates.length === 1) {
        message = 'Ik heb een datum gevonden in het document (' + moment(dates[0]).format('DD-MM-YYYY') + ') en ga er van uit dat dit de datum van het document is, klopt dat?';
    } else if (dates.length > 1) {
        message = 'Ik heb meerdere datums gevonden, welke wil je gebruiken?';
    }

    return message;
}

function generateName(document) {
    var docName = '';

    if (document.data.dates.length) {
        docName += moment(document.data.dates[0]).format('YYYY-MM-DD');
    } else {
        docName += moment().format('YYYY-MM-DD');
    }

    docName += ' - ' + document.name + document.ext;

    return docName;
}

Documents.prototype.init = function() {

    this.queue.process('new_document', function (job, done){
        if (job.data.document) {
            this.newDocument(job.data.document, done);
        } else {
            done(new Error('Missing document'));
        }
    }.bind(this));

};

Documents.prototype.newDocument = function(document, cb) {
    var utterances = this.client.bot.utterances;
    var self = this;

    document.data.transformations = {};

    // Notify the user of a new document
    this.client.bot.say({
        text: 'Hey, ik zie dat je een document gescand hebt!',
        channel: 'D109JS9RS'
    });

    // Mock message to use as a convo starter
    var message = { type: 'message',
        channel: 'D109JS9RS',
        user: 'U0L0XJ22V',
        text: 'mock',
        ts: (new Date).getTime(),
        team: 'T0L0YKDGE',
        event: 'direct_message'
    };

    // Start convo
    this.client.bot.startConversation(message, function(err, convo) {
        /**
         * Asks if the date is correct
         * @type {function(this:exports.documents)}
         */
        var askIfDateCorrect = function(response, convo) {
            convo.ask({
                text: getDateMessage(document.data.dates)
            }, [
                {
                    pattern: utterances.yes,
                    callback: function(response, convo) {
                        // If the date is correct, continue to name check
                        askIfNameCorrect(response, convo);
                        convo.next();
                    }
                },
                {
                    pattern: utterances.no,
                    callback: function(response, convo) {
                        // If the date is not correct, ask for the correct date
                        askDate(response, convo);
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response,convo) {
                        // just repeat the question
                        convo.repeat();
                        convo.next();
                    }
                }
            ]);
        }.bind(this);

        /**
         * Asks for the correct date
         * @type {function(this:exports.documents)}
         */
        var askDate = function(response, convo) {
            convo.ask('Ok, welke datum wil je?',function(response, convo) {
                var date = moment(response.text, DATE_FORMATS, true);

                if (date.isValid()) {
                    document.data.transformations.date = date.format('YYYY-MM-DD');
                    askIfNameCorrect(response, convo);
                    convo.next();
                } else {
                    convo.say({
                        text: 'Dat is geen correcte datum...'
                    });
                    convo.repeat();
                    convo.next();
                }

            });
        }.bind(this);

        /**
         * Asks for the correct name
         * @type {function(this:exports.documents)}
         */
        var askIfNameCorrect = function(response, convo) {
            var newName = generateName(document);

            convo.ask({
                text: 'Ok, en klopt deze naam?',
                attachments: [
                    {
                        'fallback': document.name,
                        'title': 'Document naam',
                        'text': document.name,
                        'color': '#7CD197'
                    }
                ]
            },[
                {
                    pattern: utterances.yes,
                    callback: function(response, convo) {
                        confirmName(convo, document);
                        cb();
                        convo.next();
                    }
                },
                {
                    pattern: utterances.no,
                    callback: function(response, convo) {
                        askName(response, convo);
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response,convo) {
                        // just repeat the question
                        convo.repeat();
                        convo.next();
                    }
                }
            ]);
        }.bind(this);

        /**
         * Asks for the correct name
         * @type {function(this:exports.documents)}
         */
        var askName = function(response, convo) {
            convo.ask('Ok, wat wil je dan als naam?',function(response, convo) {

                if (response.text) {
                    document.data.transformations.name = response.text;
                    confirmName(convo, document);
                    convo.next();
                } else {
                    convo.say({
                        text: 'Dat is geen correcte naam...'
                    });
                    convo.repeat();
                    convo.next();
                }

            });
        }.bind(this);

        var confirmName = function(convo, document) {
            var newName = '';

            console.log('document.data.dates', document.data);

            newName += document.data.transformations.dates || document.data.dates[0] || moment(new Date()).format('YYYY-MM-DD');
            newName += ' - ';
            newName += document.data.transformations.name || document.name;

            document.data.transformations.fullName = newName;

            convo.say({
                text: 'Cool, dan wordt dit de naam!',
                attachments: [
                    {
                        'fallback': newName,
                        'title': 'Document naam',
                        'text': newName,
                        'color': '#7CD197'
                    }
                ]
            });

            this.queue.create('processed_document', {
                document: document
            }).save();

        }.bind(this);


        askIfDateCorrect(err, convo);


    }.bind(this));
    //});

    //
    // this.client.controller.on('direct_message', function(bot, message) {
    //
    //     console.log('message', message);
    //
    //     // carefully examine and
    //     // handle the message here!
    //     // Note: Platforms such as Slack send many kinds of messages, not all of which contain a text field!
    // });

    // this.client.bot.startConversation({},function(err,convo) {
    //
    //     convo.ask('Is this ok?',function(response,convo) {
    //
    //         convo.say('Cool, you said: ' + response.text);
    //         convo.next();
    //
    //     });
    //
    // })


    // this.client.web.chat.postMessage('C104MCRL6', 'Woah, i\'ve found a new ' + document.type + ' in my inbox', {
    //     as_user: true
    // }, function() {});
    //
    // this.client.web.files.upload({
    //     filename: document.path.split('/')[document.path.split('/').length],
    //     title: document.path.split('/')[document.path.split('/').length],
    //     file: fs.createReadStream(document.path),
    //     filetype: 'pdf',
    //     channels: 'C104MCRL6',
    //     //initial_comment: getDateMessage(document.data.dates)
    // }, function(err, data) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });

};
