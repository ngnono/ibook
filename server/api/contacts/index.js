"use strict";

var _ = require('lodash');
var client = require('../../services/elasticsearch');
var auth = require('li-auth');

var typeName = 'xbz_contacts';

module.exports = function (router) {

    router.all(auth.isAuthenticated());

    /**
     * 根据关键字过滤联系人信息
     * /api/contacts/search
     */
    router.get('/', function (req, res) {

        var q = req.query.q || '';

        var body = {
            query: {
                filtered: {
                    query: {
                        bool: {
                            must: [],
                            should: [
                                { term: {'store_id': req.user['store_id'] }},
                                { term: {'user_id': req.user['id'] }}
                            ],
                            "minimum_should_match": 1
                        }
                    },
                    filter: {
                        bool: {
                            should: [
                                {"prefix": { "name": q }},
                                {"prefix": { "jianpin": q }},
                                {"prefix": { "index": q }},
                                {"prefix": { "mobile": q }},
                                {"prefix": {"pinyin": q}},
                                {"prefix": { "operatorcode": q }},
                                {"prefix": { "department_name": q }},
                                {"prefix": {"title": q}}
                            ]}
                    }
                }

            },
            from: req.query.from || 0,
            size: req.query.size || 100,
            sort: req.query.sort || {index: 'asc'}
        };

        /*group id process*/
        if (req.query.group_id) {
            body.query.filtered.query.bool.must.push({
                has_child: {
                    type: 'xbz_contacts_relation',
                    query: { term: {
                        'xbz_contacts_group_id': req.query.group_id
                    }}
                }
            });
        }

        client.search({
            index: client.indexName,
            type: typeName,
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

            var total = result.hits.total;

            res.json({status: 200, data: {total: total, items: items}});
        });
    });


    /**
     * 获取用户通讯录详细信息
     * /api/contacts/:id
     */
    router.get('/:id', function (req, res) {

        var body = {
            query: {
                bool: {
                    must: [
                        { term: {'_id': req.params.id }}
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
                return res.json({status: 500, message: err.message});
            }

            var data = _.first(_.map(result.hits.hits, function (item) {
                var result = item._source;
                result._id = item._id;
                return result;
            }));

            res.json({status: 200, data: data || []});
        });
    });


    /**
     * 根据用户获取所在分组
     * /api/contacts/:id/groups
     */
    router.get('/:id/groups', function (req, res) {
        var body = {
            query: {
                bool: {
                    must: [
                        { term: {'xbz_contacts_id': req.params.id }}
                    ],
                    "minimum_should_match": 1}
            },
            from: req.query.from || 0,
            size: req.query.size || 200,
            sort: req.query.sort || []
        };

        client.search({
            index: client.indexName,
            type: 'xbz_contacts_relation',
            body: body
        }, function (err, result) {
            if (err) {
                return res.json({status: 500, message: err.message});
            }

            var ids = _.map(result.hits.hits, function (item) {
                return item._source.xbz_contacts_group_id;
            });


            if (ids.length === 0) {
                return res.json({status: 200, data: []});
            }

            client.search({
                index: client.indexName,
                type: 'xbz_contacts_group',
                body: {
                    query: {
                        ids: {
                            type: 'xbz_contacts_group',
                            values: ids
                        }
                    }
                }
            }, function (err, groups) {
                if (err) {
                    return res.json({status: 500, message: err.message});
                }

                var items = _.map(groups.hits.hits, function (item) {
                    return item._source;
                });

                return res.json({status: 200, data: items || []});
            })
        });
    });
};