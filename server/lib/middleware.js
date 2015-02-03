"use strict";

var bodyParser = require('body-parser'),
    favicon = require('serve-favicon'),
    express = require('express'),
    session = require('express-session'),
    methodOverride = require('method-override'),
    passport = require('./_passport'),
    errHandlers = require('./errorHandlers'),
    RedisStore = require('connect-redis')(session),
    enrouten = require('express-enrouten');

module.exports = function (app, config) {

    /**
     * development
     */
    if (app.settings.env === 'development') {
        app.use(express.static(__dirname + '/../../client'));
        app.use('/bower_components', express.static(__dirname + '/../../bower_components'));
        app.use(session(config.get('session')));
    }

    /**
     * production
     */
    if (app.settings.env === 'production') {
        app.use(express.static(__dirname + '/../../dist'));
        app.use(session({
            store: new RedisStore(config.get('session').redisStore),
            secret: config.get('session').secret,
            resave: true,
            saveUninitialized: false
        }));
        app.enable('view cache');
    }

    app.use(favicon('client/favicon.ico'));

    /**
     * view engine
     */
    app.set('views', './server/views');
    app.set('view engine', 'ejs');
    app.disable('case sensitive routing');
    app.disable('x-powered-by');

    /**
     * body parser
     */
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(methodOverride());

    /**
     * passport init
     * [local,wechat]
     */
    passport(app, config);

    /**
     * routing
     */
    app.use('/api', enrouten({
        directory: '../api'
    }));

    /**
     * error Handler
     */
    app.use(errHandlers.serverError());
    app.use(errHandlers.fileNotFound());

    return app;
};