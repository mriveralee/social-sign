/**
 * Module dependencies.
 */

var express = require('express')
	, http = require('http');
var routes = require('./routes');


//Port Number set up
process.env.NODE_ENV = 'development';
process.env.port = 8000;
var SERVER_PORT = 8000;



var app = express();
var server = http.createServer(app);
	server.listen(SERVER_PORT, function() {
	console.log("\n**************\n* SERVER RUNNING ON PORT: " + SERVER_PORT + " *\n**************\n");
});

 var io = require('socket.io').listen(server);
//app.listen(SERVER_PORT, function() {
//	console.log("\n**************\n* SERVER RUNNING ON PORT: " + SERVER_PORT + " *\n**************\n");
//});
//console.log(process.env.port);

//Request for making HTTP(S) requests
var request = require('request');


//Serial Function Calls
var async = require('async');


/***************** MONGODB *****************************/
var mongoose = require('mongoose'),
	connect = require('connect'),
	MongoStore = require('connect-mongodb');
var my_db = 'mongodb://nodejitsu_socialsign:1f4qmdssgdm4dnhscproqqkc8b@ds043927.mongolab.com:43927/nodejitsu_socialsign_nodejitsudb8876918957';
//Local Debugging
//var my_db = 'mongodb://localhost/test';
var db = mongoose.connect(my_db);

/****************** END MONGODB *********************/
//// TESTING NODE PAD APP CRAP


///// App Configurations

app.configure(function() {
	app.set('port', process.env.port || 3000); //3000
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

	app.use(express.static('/', __dirname + '/.../public'));
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
	'std': {type: Array},
	'user_defined': {type: Array}
});
//A single gesture object
var gestureSchema = new mongoose.Schema({
	'name' : {type:String},
	'fingers_present' : {type:Array},
	'start_num_fingers' : {type: Number, default: 0},
	'end_num_fingers' : {type: Number, default: 0}//{type:Object, default: {}}
});


//Stores a bunch of chat message for a room
var chatLogSchema = new mongoose.Schema({
	'room_id': {type:String, default:""},
	'chat_log' : {type:Array, default:[]}
});

//Stores a single message
var chatMsgSchema = new mongoose.Schema({
	'username': {type:String, default:""},
	'date_created': {type:String, default:""},
	'message' : {type:String, default:""},
});


var userSchema = new mongoose.Schema({
	'id' : {type:String, default:""},
	'username' : {type:String, default:""},
	'email' : {type:String, default:""},
    'oauth_token' : {type:String, default:""},
	'oauth_secret' : {type:String, default:""},
	'confirmation_key' : {type:String, default:""},
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
	var roomID = Math.round(Math.random()*100000000);
	var route = '/room/' + roomID;
	res.redirect(route);
});





//Room Version 
app.get('/room/:room_id', function(req, res) {
	var roomID = req.param('room_id') ? req.param('room_id') : "r" + parseInt(Math.round(Math.random()*103843));
	
	var whereParams = {room_id: roomID};
	// var data = {
	// 	'room_id': roomID,
	// };

	chatLogModel.update(whereParams, whereParams, {upsert: true}, function(err, room){
			if (err) {
				throw err;
				console.log("Could not upsert user");
			}
			else {
				if (room.chat_log) {
					console.log(room);
				}
				//console.log("Chat Log in DB");
			}
		});
	console.log(roomID);
	//Get previous chat logs and render them in the file 
	res.render('index', {
		RENDERVARS: { 
			room_id: roomID
		}
	});





});

// app.get('/login', function(req, res) {
// 	res.render('login', {
// 		user : req.user
// 	});
// });

// app.get('/logout', function(req, res) {
// 	req.logout();
// 	res.redirect('/');
// });



//////////////// Socket IO //////////////////////////



// Heroku won't actually allow us to use WebSockets ******************
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
// io.configure(function () {
//   io.set("transports", ["xhr-polling"]);
//   io.set("polling duration", 10);
// });
io.set("log level", 0);

io.sockets.on('connection', function (socket) {
//  db.all("SELECT * FROM messages", function(e, r) {
//    socket.emit("message history", {"history": r});
//    console.log(r);
//  });



 // socket.emit("test", {hello:'test'});
  //console.log("SENT TEST");




/////////////// CHAT SOCKET /////////////////
 
 var getChatLogForRoom = function(data) {
	if(!data) {return;}
	var whereParams = {
		'room_id': data.room_id
	};
	//console.log("WHERE: " + whereParams);
	chatLogModel.findOne(whereParams, function(err, room) {
		if (err) {
			console.log(err);
			return
		}
		if (!room){
			return;
		}
		//console.log("FOUND ROOM: " + JSON.stringify(room.chat_log));
		var array = room.chat_log.slice(1,room.chat_log.length);
		//console.log(array);
		socket.emit('chat-message-log', array);
  	});
};

socket.on('chat-get-log', function (data) {
    getChatLogForRoom(data);
  });


//CHAT SOCKET
var emitChatMessageToClients = function(data) {
	io.sockets.emit('chat-message-received', data);
}

 socket.on('chat-message-sent', function (data) {
 	data.create_date = Math.floor(new Date().getTime() / 1000);
 	emitChatMessageToClients(data);

 	var whereParams = {
 		'room_id': data.room_id
 	};

	chatLogModel.findOne(whereParams, function(err, room) {
		if (err) {
			console.log(err);
		}

		if (!room){
			//console.log("NO ROOM");
			return;
		}

		///var messageArray = [];
		//console.log("CHAT DATA! :  " + JSON.stringify(data));
		var msgs = [];
		msgs = msgs.concat(room.chat_log,data);

		//console.log(JSON.stringify(msgs));

		room.chat_log = msgs;

		room.save(function(err) {
	    	if (err){
	        	console.log('error saving chat');
		    } 
		    else {
		    	//console.log(JSON.stringify(room));
		        //console.log('SAVED CHAT!');
			}
		});


	});
 });

///////// CHARACTER RECOGNITION FOR SERVER ////////////
	var emitCharacterToClients = function(data) {
		sockets.emit('chat-message-received', data);
	}



	socket.on('undetected-character-sent', function (data) {
		//Compare to characters in the database
	  	 if (!data && !data.fingers_present){return;}
	  	 var characterData = {
	  		 fingers_present: data.fingers_present
	     };
	     // 	start_num_fingers: data.start_num_fingers,
	   // 	end_num_fingers: data.end_num_fingers,

	    console.log(characterData);
		//if match emit matched character 
		gestureModel.findOne(characterData, function(err, match) {
			if (err) {
				console.log(err);
				return;
			}

			if (!match){
				console.log('NO MATCH');
				return;
			}

			else {
				match.sent_username = data.sent_username;
				console.log(match);
				socket.emit('detected-character-received', match);
				console.log('MATCH!');
			}
		});
	});

///// LEAP SOCKET
	socket.on('leap-data-sent', function (data) {
		//Compare to characters in the database
		console.log(data);
		console.log("LEAP RECEIVED!!");

		socket.emit('leap-data-received', data);
	});





});
/////////////////////////////////////////////////////
/// SAMPLE CHARACTERS FOR THE DATABASE

var addCharToDatabase = function (data) {
	gestureModel.update(data, data, {upsert: true}, function(err, letter){
			if (err) {
				throw err;
				console.log("Could not upsert user");
			}
			if (!letter) return;
			else {	
				console.log(data.name+ " IN DB");
			}
		});
};


///SAMPLE CHARACTERS 
var sampleChars = function() {
	var letter1 = {
		name: "A",
		start_num_fingers: 5,
    	end_num_fingers: 1,
    	fingers_present: [1,0,0,0,0]
	};
	var letter2 = {
		name: "B",
		start_num_fingers: 5,
    	end_num_fingers: 4,
    	fingers_present: [1,1,1,1,0]
	};

	var letter3 = {
		name: "D",
		start_num_fingers: 5,
    	end_num_fingers: 1,
    	fingers_present: [0,1,0,0,0]
	};

	var letter4 = {
		name: "E",
		start_num_fingers: 5,
    	end_num_fingers: 0,
    	fingers_present: [0,0,0,0,0]
	};

	var letter5 = {
		name: "F",
		start_num_fingers: 5,
    	end_num_fingers: 3,
    	fingers_present: [0,0,1,1,1]
	};

	var letter6 = {
		name: "H",
		start_num_fingers: 5,
    	end_num_fingers: 2,
    	fingers_present: [0,1,1,0,0]
	};
	var letter7 = {
		name: "I",
		start_num_fingers: 5,
    	end_num_fingers: 1,
    	fingers_present: [0,0,0,0,1]
	};
	var letter8 = {
		name: "L",
		start_num_fingers: 5,
    	end_num_fingers: 2,
    	fingers_present: [1,1,0,0,0]
	};
	var letter9 = {
		name: "W",
		start_num_fingers: 5,
    	end_num_fingers: 3,
    	fingers_present: [0,1,1,1,0]
	};
	var letter10 = {
		name: "Y",
		start_num_fingers: 5,
    	end_num_fingers: 2,
    	fingers_present: [1,0,0,0,1]
	};





	addCharToDatabase(letter1);
	addCharToDatabase(letter2);

	addCharToDatabase(letter3);
	addCharToDatabase(letter4);

	addCharToDatabase(letter5);
	addCharToDatabase(letter6);

	addCharToDatabase(letter7);
	addCharToDatabase(letter8);

	addCharToDatabase(letter9);
	addCharToDatabase(letter10);
};

sampleChars();



////////////////////////// WEB SOCKETS FOR LEAP









//===== PUBLIC =================================================================
module.exports.database = db;
module.exports.io = io;
module.exports.server = app;
