"use strict";

var client = require('../../services/elasticsearch');
var _ = require('lodash');
var auth = require('li-auth');

var typeName = 'xbz_contacts_group';

module.exports = function (router) {

    router.all(auth.isAuthenticated());

    /**
     * 根据门店和用户Id获取分组列表
     * /api/groups
     */
    router.get('/', function (req, res) {
        var body = {
            query: {
                bool: {
//                    must: [
//                        { term: {'type': 'enterprise' }}
//                    ],
//                    should: [
//
//                    ]

                }
            },
            from: req.query.from || 0,
            size: req.query.size || 100,
            sort: [
                {sort_order: 'desc'}
            ]
        };

        if (req.query.type) {
            body.query.bool.must = [
                { term: {'type': xbzContactsType.Customer }},
                { term: {'user_id': req.user['id'] }}
            ];
        } else {
            body.query.bool.should = [
                { term: {'type': 'enterprise' }},
                { term: {'user_id': req.user['id'] }}
            ];
        }

        client.search({
            index: client.indexName,
            type: typeName,
            body: body
        }, function (err, result) {

            if (err) {
                console.log(err);
                return res.status(500).json({status: 500, message: err.message});
            }

            var items = _.map(result.hits.hits, function (item) {
                var result = item._source;
                result._id = item._id;
                return result;
            });

            var groupIds = _.map(items, function (item) {

                return {term: {
                    'xbz_contacts_group_id': item._id
                }};

            });

            client.search({
                index: client.indexName,
                type: 'xbz_contacts_relation',
                body: {
                    query: {
                        bool: {
                            should: groupIds
                        }
                    },
                    facets: {
                        "group": {
                            terms: {
                                "field": "xbz_contacts_group_id"
                            }
                        }
                    },
                    from: 0,
                    size: 0
                }
            }, function (err, groupCountResult) {

                var map = {};
                _.forEach(groupCountResult.facets.group.terms, function (item) {
                    map[item.term] = item.count;
                });

                _.forEach(items, function (item) {
                    item.count = map[item._id];
                });

                res.json({status: 200, data: items});
            });
        });
    });

    router.get('/:id', function (req, res) {
        var body = {
            query: {
                bool: {
                    must: [
                        { has_child: {type: 'xbz_contacts_relation', term: {'xbz_contacts_group_id': req.query.id} }},
                        { term: {'user_id': req.user['id'] }}
                    ],
                    should: [
                        { term: {'store_id': req.user['store_id'] }},
                        { term: {'user_id': req.user['id'] }}
                    ],
                    "minimum_should_match": 1}
            },
            from: req.query.from || 0,
            size: req.query.size || 200,
            sort: req.query.sort || []
        };

        client.search({
            index: client.indexName,
            type: typeName,
            body: body
        }, function (err, result) {

            if (err) {
                console.log(err);
                return res.status(500).json({status: 500, message: err.message});
            }

            var data = _.first(_.map(result.hits.hits, function (item) {
                var result = item._source;
                result._id = item._id;
                return result;
            }));

            res.json({status: 200, data: data});
        });
    });
};