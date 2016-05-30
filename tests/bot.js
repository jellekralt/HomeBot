var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var chai = require('chai');
var proxyquire = require('proxyquire');
var expect = chai.expect;

var interactMock = {
    createClient: function() {
        return {
            start: function() {
                console.log('start!');
            }
        };
    }
};

var HomeBot = proxyquire('../lib/HomeBot', {
    './interact': interactMock
});

var bb8, config;

describe('HomeBot', function() {

    it('should store the config', function(done) {
        options = {persona: 'bb8', slack: {token: 'bar' }, wit: {token: 'bar' }};

        bot = new HomeBot(options);

        expect(bot.options).to.deep.equal(options);

        done();
    });

    it('should default the persona to bb8', function(done) {
        options = {slack: {token: 'bar' }, wit: {token: 'bar' }};

        bot = new HomeBot(options);

        expect(bot.options).to.deep.equal(_.merge({}, options, {persona: 'bb8'}));

        done();
    });

    it('should load the persona to the object', function(done) {
        options = {persona: 'bb8', slack: {token: 'bar' }, wit: {token: 'bar' }};

        bot = new HomeBot(options);

        expect(bot.persona.name).to.equal('BB-8');

        done();
    });

});
