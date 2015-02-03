"use strict";

/*
 * 
 * http://www.liangyali.com
 *
 * Copyright (c) 2014 liangyali
 * Licensed under the MIT license.
 */

var Sdk = require('li-sdk');
var _ = require('lodash');
var util = require('util');
var sha1 = require('sha1');
var config = require('config');

function Socket(settings, routes) {

    Sdk.call(this, settings, routes);

    this.use(function (options, done) {

        var timestamp = +new Date();
        var once = +new Date();
        var appKey = options.settings.appKey;
        var appSecure = options.settings.appSecure;

        var values = [
            appKey,
            once,
            timestamp,
            appSecure
        ];

        var sign = sha1(values.join('-'));
        options.requestOptions = _.assign(options.requestOptions, {
            headers: {
                'AppKey': appKey,
                'Nonce': once,
                'TimeStamp': timestamp,
                'Signature': sign
            }
        });

        done(null, options);
    });
}


util.inherits(Socket, Sdk);

var routes = {
    'user.token': {
        uri: '/user/token',
        method: 'POST'
    }
};

var settings = config.get('socket');


/**
 * exports ims
 * @type {ImsClient}
 */
module.exports = new Socket(settings, routes);