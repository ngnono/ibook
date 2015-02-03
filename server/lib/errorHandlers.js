"use strict";

var _ = require('lodash');

exports.fileNotFound = function () {
    return function (req, res, next) {
        var model = { url: req.url, message: 'not found:' + req.url, code: 404 };
        res.send(404, model);
    };
};

exports.serverError = function () {
    return function (error, req, res, next) {
        var model = { url: req.url, message: error.message, code: 500 };
        res.json(model);
    };
};