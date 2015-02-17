"use strict";

var client = require('../../services/elasticsearch');
var _ = require('lodash');

module.exports = function (router) {

    router.all(function (req, res, next) {
        if (process.env.NODE_ENV === 'production') {
            return res.json({code: 400, message: 'not development'});
        }

        next && next();
    })

    router.get('/autologin', function (req, res) {

        req.logout();
        req.login({
            chatUserId: req.query.chatUserId,
            name: req.query.name,
            store_id: 79,
            id: 200
        }, function (err) {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    });

    router.get('/users', function (req, res) {

        var body = {
            query: {
                match_all: {}
            },
            from: 0,
            size: 100};

        client.search({
            index: client.indexName,
            type: 'xbz_contacts',
            body: body
        }, function (err, result) {
            if (err) {
                return res.json(500, {status: 500, message: err.message});
            }

            var items = _.map(result.hits.hits, function (item) {
                var result = item._source;
                result._id = item._id;
                return result;
            });

            res.render('test/users', {items: items});
        });
    });
};