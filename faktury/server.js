var request = require('request');
var routes = require('./routes');
var express = require('express');
var pg = require('pg');

var conString = "postgres://postgres:@localhost:5433/invoicera";
db = new pg.Client(conString);
db.connect();

app = module.exports = express.createServer(
    express.bodyParser()
    , express.static(__dirname + "/public")
    , express.favicon()
    , express.cookieParser()
    , express.session({ secret:'htuayreve'})
);

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.logger());
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions:true,
        showStack:true
    }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

app.get('/', routes.index);

app.listen(8086, function () {
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

require('./data.js');
