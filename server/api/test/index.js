"use strict";

module.exports = function (router) {

    router.get('/autologin', function (req, res) {

        if (process.env.NODE_ENV === 'production') {
            return res.json({code: 400, message: 'not development'});
        }

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
            res.json({code: 200, message: err, result: req.user.name});
        });
    });
};