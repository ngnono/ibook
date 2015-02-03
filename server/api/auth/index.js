"use strict";

var passport = require('passport');

/**
 * 微信用户登陆
 * @param router
 */
module.exports = function (router) {

    router.get('/wechat', passport.authenticate('wechat'));

    router.get('/wechat/callback', passport.authenticate('wechat', {
        failureRedirect: '/auth/fail/wechat'
    }), function (req, res, next) {

        res.cookie('__user', true, { expires: new Date(Date.now() + 900000), httpOnly: false });
        res.json({status: 200, user: req.user});
    });

    router.post('/local',
        passport.authenticate('local', { failureRedirect: '/login' }),
        function (req, res) {
            res.redirect(req.session.returnTo || '/home');
        });
};
