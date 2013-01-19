/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var SERVER_PORT = 8000;

//Request for making HTTP(S) requests
var request = require('request');

//Serial Function Calls
var async = require('async');


/***************** MONGODB *****************************/
var mongoose = require('mongoose'),
	connect = require('connect'),
	MongoStore = require('connect-mongodb');
//mongoose.connect('mongodb://nodejitsu:9c28b994d494429442ba453dd21f1faf@alex.mongohq.com:10059/nodejitsudb763664407039');
//var db = mongoose.createConnection('mongodb://nodejitsu:9c28b994d494429442ba453dd21f1faf@alex.mongohq.com:10059/nodejitsudb763664407039');

var my_db = 'mongodb://nodejitsu:9c28b994d494429442ba453dd21f1faf@alex.mongohq.com:10059/nodejitsudb763664407039';
//Local Debugging
//var my_db = 'mongodb://localhost/test';
var db = mongoose.connect(my_db);

/****************** END MONGODB *********************/
//// TESTING NODE PAD APP CRAP


///// App Configurations
var app = express();

app.configure(function() {
	app.set('port', process.env.port || 3000);
	app.set('views', __dirname + '/views');
	
	//Template Enginer
	app.set('view engine', 'ejs');

	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());

	//Session Management 
	app.use(express.cookieParser()); 
	app.use(express.session({ 
		store: MongoStore(my_db), 
		secret: 'OMG_SuperTopSecret!@#54^!!!!!!flfdd:CW' 
	}));


	//DEBUG
	app.use(express.errorHandler());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});
//
app.configure('development', function() {
	app.use(express.errorHandler());
	app.set('port', app.get('port'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
});

/********** MONGO SCHEMA ******************/

//Gesture data (contains user-defined and standard schema)
var gestureDataSchema = new mongoose.Schema({
	'std': Array,
	'user_defined': Array
});
//A single gesture object
var gestureSchema = new mongoose.Schema({
	'name' : String,
	'data' : String
});


//Stores a bunch of chat message for a room
var chatLogSchema = new mongoose.Schema({
	'room_id': String,
	'message' : Array
});

//Stores a single message
var chatMsgSchema = new mongoose.Schema({
	'username': String,
	'message' : String
});


var userSchema = new mongoose.Schema({
	'id' : String,
	'username' : String,
	'email' : String,
    'oauth_token' : String,
	'oauth_secret' : String,
	'confirmation_key' : String,
	'confirmed' : Boolean,
	'date_created' : Number,
	'timestamp_last_tagged' : Number
});



var chatMsgModel = db.model('Chat_Msg', chatMsgSchema);
var chatLogModel = db.model('Chat_Log', chatLogSchema);
var gestureDataModel = db.model('Gesture_Data', gestureDataSchema);
var gestureModel = db.model('Gesture', gestureSchema);



userSchema.methods.setEmail = function(email) {
	this.email = email;
}
userSchema.methods.setConfirmationKey = function(key) {
	this.confirmation_key = key;
}
userSchema.methods.setConfirmed = function(isConfirmed) {
	this.confirmed = isConfirmed;
}
userSchema.methods.setTimestampLastTagged = function(runTimestamp) {
	this.timestamp_last_tagged = runTimestamp;
}

var UserModel = db.model('User', userSchema);



/************ ************* ****************/



///Routes
app.get('/', function(req, res) {
	res.render('index', {
		user : req.user
	});
});


app.get('/login', function(req, res) {
	res.render('login', {
		user : req.user
	});
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});


//Route for confirming a user in the db

app.get('/confirm/:email/:key', function(req, res) {
	var key = req.param('key');
	var email = req.param('email');
	if(email && key) {
		//Check if actual email
		var isEmail = Validator.check(email).isEmail();
		if(!isEmail) {
			sendErrorResponse(res, "Invalid Email address");
		}
		var validEmail = Validator.sanitize(email).str;
		var validKey = Validator.sanitize(key).str;

		//If no trickery in our email or key, find the user in our db
		if(validEmail && validKey && validKey != "") {
			var whereUserParams = {
				'email' : validEmail,
				'confirmation_key' : validKey
			};

			UserModel.findOne(whereUserParams, function(err, user) {
		    	//No such user/key
		    	if (err) {
		    		sendErrorResponse(res, "Invalid Confirmation Key");
		    		return;
		    	}
		    	//If we have a user, update them
		    	if (user != null) {
			   		console.log(user);
			   		if (user.confirmed === true) {
			   			sendResponse(res, "You are already confirmed! Wooo!");
						return;
			   		}
			   		else {
			   			user.confirmed = 1;
						user.save(function(err) {
					    	if (err){
					        	console.log('error confirming user');
					    		sendErrorResponse(res, "Error confirming user");
					    		return;
						    } 
						    else {
						        console.log('success confirming user');
						    	sendResponse(res, "You are confirmed! Wooo!");
								return;
							}
				    	});
					}
				}
			});
		}
	} 
	else {
		sendErrorResponse(res, "Invalid Confirmation Key");
	}
});



//////////////// Socket IO //////////////////////////

// var app = require('express')()
//   , server = require('http').createServer(app)
//   , io = require('socket.io').listen(server);

// server.listen(80);
var socketApp = require('http').createServer(express())
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);


//Config
server.listen(81);
io.set("log level", 0);

io.sockets.on('connection', function (socket) {
//  db.all("SELECT * FROM messages", function(e, r) {
//    socket.emit("message history", {"history": r});
//    console.log(r);
//  });

 socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.emit("test", {hello:'test'});
  //console.log("SENT TEST");
  socket.on('disconnect', function() {
    io.sockets.emit('user left room');
  });
  socket.emit("user entered room");


  socket.on('chat message', function (data) {
    data.create_date = Math.floor(new Date().getTime() / 1000);
    data.room = "blah";
    io.sockets.emit('chat message', data);
    console.log(data);

    // record the chat message at some point
    // db.run("INSERT INTO messages (create_date, user, room, message) values (?, ?, ?, ?)", data.create_date, data.user, data.room, data.message);
  });
});
/////////////////////////////////////////////////////











////////////// LISTENING AT PORT //////////////////////////
app.listen(SERVER_PORT, function() {
	console.log("\n********************************\n* SERVER RUNNING ON PORT: " + SERVER_PORT + " *\n********************************\n");
});


//===== PUBLIC =================================================================
module.exports.database = db;
