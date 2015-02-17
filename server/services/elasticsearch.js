"use strict";

var elasticsearch = require('elasticsearch'),
    config = require('config');

var client = new elasticsearch.Client(config.get('elasticsearch'));

module.exports = client;
module.exports.indexName = 'intime';