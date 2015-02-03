"use strict";

var socket = require('../../lib/socket');
var config = require('config');
var auth = require('li-auth');

module.exports = function (router) {

    router.all(auth.isAuthenticated());

    router.get('/token', function (req, res) {

        var socketUrl = config.get('socket').server;
        var userId = req.user.chatUserId;

        socket.user.token({
            id: userId,
            avatar: 'http://1.img',
            name: req.user.name
        }).then(function (result) {

            if (result.code === 200) {
                res.json({code: 200, userId: userId, url: socketUrl + '?token=' + result.token});
            } else {
                res.json({code: 500, message: result.message});
            }
        }, function (err) {
            res.json({code: err, message: err.message})
        });
    });
};
