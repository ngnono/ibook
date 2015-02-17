/**
 * User: ngnono
 * Date: 15-2-15
 * Time: 上午10:14
 * To change this template use File | Settings | File Templates.
 */

'use strict';

var _ = require('lodash');
var S = require('string');

var tools = require('./utils');

var xbzContactsType = tools.xbzContactsType;


module.exports = BaseController;

module.exports.response4error = error4response;

/**
 * owner
 * @type {owner}
 */
module.exports.ownerHandler = _owner;


function BaseController(opts) {

}

/**
 *
 * @param opts
 * @param callback
 */
BaseController.prototype.del = function (opts, callback) {

};


/**
 * response
 * @type {error4response}
 */
BaseController.prototype.response4error = error4response;


/**
 * 标准输出  default json
 * @param opts
 * @param req
 * @param res
 * @returns {*}
 */
function standard4response(opts, req, res) {
    opts = opts || {};
    req = req || {};
    if (!res) {
        res = req;
        req = {};
    }

    res.status(opts.status || 200);

    return res.json(opts);
}


/**
 * 正确 200 响应    default json
 * @param opts
 * @param req
 * @param res
 * @returns {*}
 */
function ok4response(opts, req, res) {
    opts = opts || {};
    req = req || {};

    if (!res) {
        res = req;
        req = {};
    }

    res.status(200);

    return res.json({status: 200, message: opts.message});
}


/**
 * 错误处理
 * @param err
 * @param res
 * @returns {*}
 */
function error4response(err, req, res) {
    err = err || {};
    req = req || {};

    if (!res) {
        res = req;
        req = {};
    }

    if (err.status) {
        res.status(err.status)
    }

    return res.json({status: err.status || 500, message: err.message});
}


/**
 *
 * @param opts
 * @returns {_filter}
 * @private
 */
function _owner(opts) {

    opts = opts || {};

    var key = opts.key || 'id';
    var userKey = opts.userKey || 'user';
    var type = xbzContactsType.Customer;
    var modelKey = opts.modelKey || 'model';
    var modelUserId = opts.modelUserIdKey || 'user_id';

    /**
     * 自己的
     */
    var _filter = function (req, res, next) {

        var id = req.params[key];
        var user = req[userKey];
        var model = req[modelKey];

        if (!model) {
            res.status(404);
            res.json({status: 404, message: 'not found for id:' + id});

            return;
        }

        if (model[modelUserId] !== user.id) {
            res.status(400);
            res.json({status: 400, message: 'the contacts is not your。'});

            return;
        }

        var ms = ['POST', 'PUT', 'DELETE'];

        if (_.include(ms, req.method)) {
            if (model.type !== type) {
                res.status(400);
                res.json({status: 400, message: S('contact cannot be {{method}}, because contact.type is {{type}}."').template({method: req.method, type: model.type}).s });

                return;
            }
        }

        next();
    };

    return _filter;
}


function _authenticate(opts) {
    opts = opts || {};

    var _filter = function(){};

    return _filter;
}