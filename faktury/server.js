var request = require('request');
var routes = require('./routes');
var express = require('express');
var pg = require('pg');
var everyauth = require('everyauth');
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();
var http = require('http');
var connect = require('connect');
var parseCookie = require('cookie').parse;

everyauth.debug = true;
var conString = "postgres://postgres:@localhost:5433/invoicera";
db = new pg.Client(conString);
db.connect();

var sendUserData;
var sessionUsers = {};

// //////////////////////////////////
everyauth.google
		.appId(
				"234305409034-4p4rfegifp4sdd87f54papuab4r2t7r3.apps.googleusercontent.com")
		.appSecret("q10ak7_qxRUvuQHqlQmOOJFQ")
		.scope(
				'https://www.googleapis.com/auth/userinfo.profile https://www.google.com/m8/feeds/')
		.findOrCreateUser(function(sess, accessToken, extra, googleUser) {
			console.log("User is logged in: ", googleUser);
			console.log("accessToken: ", accessToken);

			// tady muzeme priradit nase data uzivatele z DB, protoze tady mame
			// zaruceno, ze se uspesne prihlasil
			// access token se muze hodit pro pristup ke sluzbam google

			sess.user = {
				googleUser : googleUser,
				accessToken : accessToken,
				dbInfo : null
			};
			return googleUser;
		}).redirectPath('/index.html');

// ///////////////////////////////
// Made by https://github.com/visionmedia/express/wiki/Migrating-from-2.x-to-3.x
// - see Socket.IO compatibility

var express = require('express');
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();
app = express();
var http = require('http');
var server = http.createServer(app);
io = require('socket.io').listen(server);

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.engine('html', require('ejs').renderFile);
	app.use(express.bodyParser());
	app.use(express.favicon());
	app.use(express.cookieParser());
	app.use(express.session({
		store : sessionStore,
		secret : "htuayreve"
	}));
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.logger());
	app.use(express.static(__dirname + '/public'));
	app.use(everyauth.middleware());
});

app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('production', function() {
	app.use(express.errorHandler());
});

// app.get('/', routes.index);

app.get('/svc/userdata', function(req, res) {
	res.contentType('json');
	var userData = req.session.user;
	if (userData) {
		res.json({
			success : true,
			userData : userData
		});
	} else {
		res.json({
			success : false
		});
	}
});

function handleIndexHtml(req, res) {
	console.log("blaaaaaaaaaaaaaaa");
	// console.log(req.session);
	var userData = req.session.user; // tohle jsme si zaregistrovali pri
										// prihlaseni
	// sessionUsers[req.sessionID] = userData;
	console.log("req:", req);
	console.log("userData:", userData);

	var dbInfo = {};
	if (userData) {
		if (userData.dbInfo == null && userData.googleUser) {

			var sql = "Select login, role_code from operator where login =$1";
			db.query(sql, [ userData.googleUser.id ], function(err, rs) {
				if (err) {
					console.log(err);
					handleWrongUser(res);
				} else {
					if (rs.rows.length > 0) {
						userData.dbInfo = rs.rows[0];
						res.sendfile("public/index.html");
					} else {
						res.redirect('wrong-user.html');
					}
				}
			});
		} else {
			res.redirect('index.html');
		}
	} else {
		res.redirect('auth/google/');
	}
}

app.get('/', handleIndexHtml);
app.get('/index.html', handleIndexHtml);

server.listen(8089);

io.set('authorization', function(data, accept) {
	if (data.headers.cookie) {
		data.cookie = parseCookie(data.headers.cookie);
		data.sessionID = connect.utils.parseSignedCookie(
				data.cookie['connect.sid'], 'htuayreve');
		sessionStore.get(data.sessionID, function(err, session) {
			if (err || !session) {
				// if we cannot grab a session, turn down the connection
				accept('Error', false);
			} else {
				// save the session data and accept the connection
				console.log("!!!!!!!!!found session: ", session);
				data.session = session;
				accept(null, true);
			}
		});
	} else {
		return accept('No cookie transmitted.', false);
	}
});

io.sockets.on('connection', function(socket) {
	socket.on("test", function(data) {
		console.log(data);
		console.log("------------------------");
		console.log(socket.handshake.session);
		socket.emit("userdata", {
			user : socket.handshake.session.user
		});
	});
});

require('./data.js');
