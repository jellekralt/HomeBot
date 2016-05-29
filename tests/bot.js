var path = require('path');
var fs = require('fs');
var chai = require('chai');
var expect = chai.expect;

var HomeBot = require('../lib/HomeBot');
var bb8, config;

describe('HomeBot', function() {

    beforeEach(function() {
        config = { slack: {token: 'foo' }, wit: {token: 'foo' }};

        bb8 = new HomeBot(config);
    });

    it('should store the config', function(done) {
        expect(bb8.config).to.equal(config);

        done();
    });

});
