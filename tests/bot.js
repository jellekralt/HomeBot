var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var chai = require('chai');
var expect = chai.expect;

var HomeBot = require('../lib/HomeBot');
var bb8, config;

describe('HomeBot', function() {

    it('should store the config', function(done) {
        options = {persona: 'bb8', slack: {token: 'bar' }, wit: {token: 'bar' }};

        bb8 = new HomeBot(options);

        expect(bb8.options).to.deep.equal(options);

        done();
    });

    it('should default the persona to bb8', function(done) {
        options = {slack: {token: 'bar' }, wit: {token: 'bar' }};

        bb8 = new HomeBot(options);

        expect(bb8.options).to.deep.equal(_.merge({}, options, {persona: 'bb8'}));

        done();
    });

});
