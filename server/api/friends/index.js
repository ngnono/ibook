"use strict";

"use strict";

var _ = require('lodash');
var client = require('../../services/elasticsearch');
var uuid = require('node-uuid');
var moment = require('moment');
var S = require('string');
var auth = require('li-auth');
var async = require('async');
var ims = require('../../services/ims');

var tools = require('../../lib/utils');
var xbzContactsType = tools.xbzContactsType;

var BaseController = require('../../lib/baseController');
var error4response = BaseController.response4error;
var owner = BaseController.ownerHandler;


var datetimeFormat = tools.datetimeFormat; // 'YYYY-MM-DDTHH:mm:ssZ';
var typeName = 'xbz_contacts';
var type4relation = 'xbz_contacts_relation';

module.exports = function (router) {

    router.all(auth.isAuthenticated());


    /**
     * 截取id
     */
    router.param('id', function (req, res, next, id) {

        var body = {
            query: {
                bool: {
                    must: [
                        { term: {'_id': id }}
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

                return next(err);
                //return res.json({status: 500, message: err.message});
            }

            var data = _.first(_.map(result.hits.hits, function (item) {
                var result = item._source;
                result._id = item._id;
                return result;
            }));

            if (!data) {
                return next(new Error('failed to load contacts(' + id.toString() + ').'));
            }

            /**
             * 小本子 业务对象 contacts
             */
            req.xbzContact = data;

            next();
        });
    });

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
    router.get('/get/:id', function (req, res) {

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

    /**
     * 根据id获取用户信息
     */
    router.get('/profiles', function (req, res) {
        var ids = req.query.ids || '';

        var parts = ids.split(',');
        if (parts.length === 0) {
            return res.json({status: 400, message: 'ids参数错误'});
        }

        console.log(parts)

        client.search({
            index: client.indexName,
            type: 'xbz_contacts',
            body: {
                query: {
                    ids: {
                        type: 'xbz_contacts',
                        values: parts
                    }
                }
            }
        }, function (err, result) {
            if (err) {
                return res.json({status: 500, message: err.message});
            }

            var items = _.map(result.hits.hits, function (item) {
                var result = item._source;
                result._id = item._id;
                return result;
            });

            return res.json({status: 200, data: items || []});
        });
    });


    /**
     * 新增联系人 SAVE
     */
    router.post('/', function (req, res) {

        var body = req.body || {};
        var user = req.user;

        body['user_id'] = user.id;
        body['type'] = xbzContactsType.Customer;


        var py = tools.getPinyin(body['name']);
        var adindex = tools.getAddressIndex(py);

        body['pinyin'] = py;
        body['index'] = adindex;
        body['jianpin'] = tools.getJianPin(body['name']);

        //default
        body['created_date'] = body['updated_date'] = moment().format(datetimeFormat);
        // = moment().format(datetimeFormat);

        var groups = body.groups;
        delete body.groups;

        var doc = {
            index: client.indexName,
            type: typeName,
            id: uuid.v1(),
            body: body
        };

        console.log(doc);
        //save contact
        var fn1 = function (cb) {
            client.index(doc, function (err, rst) {

                if (err) {
                    return cb(err);
                }

                cb(null, {
                    _id: rst._id
                });

                //console.log(rst);
//            { _index: 'intime',
//                _type: 'xbz_contacts',
//                _id: '08190740-b349-11e4-8a5e-0b8cc8b50d27',
//                _version: 1,
//                created: true }

            });
        };

        //save relation
        var fn2 = function (obj, cb) {
            if (!groups) {
                return cb(null, {_id: obj._id});
            }
            var fns = {};

            _.forEach(groups, function (g) {
                var kk = obj._id + '_' + g._id;
                fns[kk] = function (c) {
                    var contactGroupDoc = {
                        index: client.indexName,
                        type: type4relation,
                        id: kk,
                        parent: obj._id,
                        body: {
                            xbz_contacts_id: obj._id,
                            xbz_contacts_group_id: g._id,
                            type: xbzContactsType.Customer,
                            user_id: user.id
                        }
                    };


                    client.index(contactGroupDoc, function (err, rst) {
                        if (err) {
                            console.log(err);
                            return c(err);
                        } else {
                            c(null, rst);
                        }
                    });
                }
            });

            async.parallel(fns, function (e, r) {
                if (e) {
                    return cb(e);
                }

                cb(null, {
                    _id: obj._id,
                    relationIds: _.keys(r)
                })
            });

        };

        async.waterfall([fn1, fn2], function (err, rst) {
            console.log('hello');
            if (err) {
                console.log(err);

                return error4response(err, res);
            }
            else {

                body._id = rst._id;
                res.json({status: 201, data: body});
            }
        });
    });


    /**
     * delete 联系人
     */
    router.delete('/:id', [owner({modelKey: 'xbzContact'})], function (req, res) {
        var id = req.params.id;
        var user = req.user;
        //需要先验证下 当前的TYPE 是否时 CUSTOMEER，只有这个TYPE的可以被删除。

        var opts = {
            index: client.indexName,
            type: typeName,
            id: id
        };

        //console.log(opts);
        //需要先删除关系

        var relationOpts = {
            index: client.indexName,
            type: type4relation,
            body: {
                query: {
                    bool: {
                        must: [
                            { term: {'xbz_contacts_id': id }}, //,
                            { term: {'user_id': user.id}},
                            { term: {'type': xbzContactsType.Customer}}
                        ]
                    }
                }
            }
        };

        /**
         * DEL CONTACT
         * @param cb
         */
        var fn1 = function (cb) {
            client.delete(opts, function (err, rst) {
                if (err) {
                    return cb(err);
                }
                cb(null, rst);
            });
        };

        /**
         * del relation
         * @param cb
         */
        var fn2 = function (cb) {
            //console.log(relationOpts) ;
            client.deleteByQuery(relationOpts, function (err, rst) {
                if (err) {
                    return cb(err);
                }
                cb(null, rst);
            });
        };

        async.series({ delContact: fn1, delRelation: fn2}, function (err, rst) {
            if (err) {
                console.log(err);

                return error4response(err, res);
            } else {

                //console.log(JSON.stringify( rst));
                res.status(204);
                res.json({status: 204});
            }
        });
    });


    /**
     * 修改联系人
     */
    router.put('/:id', [owner({modelKey: 'xbzContact'})], function (req, res) {

        var id = req.params.id;
        var contact = req.xbzContact;
        var body = req.body || {};
        var user = req.user;

        body['user_id'] = req.user.id;
        body['type'] = xbzContactsType.Customer;

        var py = tools.getPinyin(body['name']);
        var index = tools.getAddressIndex(py);

        body['pinyin'] = py;
        body['index'] = index;
        body['jianpin'] = tools.getJianPin(body['name']);

        body['updated_date'] = new moment().format(datetimeFormat);
        body['created_date'] = contact.created_date || new moment().format(datetimeFormat);


        var groups = body.groups;
        delete body.groups;

        var doc = {
            index: client.indexName,
            type: typeName,
            id: id,
            body: body
        };

        /**
         * 1.获取到 该用户自建的组关系 该联系人ID相关的
         * 2.不做对比了，直接删除，然后SAVE，当发生异常，恢复即可
         */

        /**
         *  delete
         * @param cb
         */
        var fn2 = function (obj, cb) {
            var relationOpts = {
                index: client.indexName,
                type: type4relation,
                body: {
                    query: {
                        bool: {
                            must: [
                                { term: {'xbz_contacts_id': obj._id }},
                                { term: {'user_id': user.id}},
                                // { term: {'user_id': user.id}},
                                { term: {'type': xbzContactsType.Customer}}
                            ]
                        }
                    }
                }
            };

            client.deleteByQuery(relationOpts, function (err, rst) {
                if (err) {
                    return cb(err);
                }
                cb(null, obj);
            });
        };


        // console.log(doc);
        //save contact
        var fn1 = function (cb) {
            client.index(doc, function (err, rst) {

                if (err) {
                    return cb(err);
                }

                cb(null, {
                    _id: rst._id
                });

                //console.log(rst);
//            { _index: 'intime',
//                _type: 'xbz_contacts',
//                _id: '08190740-b349-11e4-8a5e-0b8cc8b50d27',
//                _version: 1,
//                created: true }

            });
        };

        //save relation
        var fn3 = function (obj, cb) {
            if (!groups) {
                cb(null, {_id: obj._id});
            }
            var fns = {};

            _.forEach(groups, function (g) {
                var kk = obj._id + '_' + g._id;
                fns[kk] = function (c) {
                    var contactGroupDoc = {
                        index: client.indexName,
                        type: type4relation,
                        id: kk,
                        parent: obj._id,
                        body: {
                            xbz_contacts_id: obj._id,
                            xbz_contacts_group_id: g._id,
                            type: xbzContactsType.Customer,
                            user_id: user.id
                        }
                    };


                    client.index(contactGroupDoc, function (err, rst) {
                        if (err) {
                            console.log(err);
                            return c(err);
                        } else {
                            c(null, rst);
                        }
                    });
                }
            });

            async.parallel(fns, function (e, r) {
                if (e) {
                    return cb(e);
                }

                cb(null, {
                    _id: obj._id,
                    relationIds: _.keys(r)
                })
            });

        };

        async.waterfall([fn1, fn2, fn3], function (err, rst) {
            if (err) {
                console.log(err);

                return error4response(err, res);
            }
            else {

                body._id = rst._id;

                res.status(201);
                res.json({status: 201, data: body});
            }
        });


//        client.index(doc, function (err, rst) {
//            if (err) {
//                return error4response(err, res);
//            }
//
//            body._id = rst._id;
//            res.status(201);
//            res.json({status: 201, data: body});
//        });
    });
};