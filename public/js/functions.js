/////// GLOBAL VARS 
var GLOBAL = {};
  GLOBAL.username = "User " + parseInt(Math.round(Math.random()*112764+13));
  //Gets room id from url
  GLOBAL.room_id = (document.URL).replace(/^.*room\//, "");
  GLOBAL.has_chat_log = false;
//KEY PRESS
var KEY_CODE = {
    ENTER: 13

};
var ws;


$(document).ready(function() {

/////SOCKET IO //////////////////////////
 var socket = io.connect(window.location.hostname);
  ///Input from server
    socket.on("news", function (data) {
      //console.log(data);
      socket.emit("my other event", { my: "data" });
    });

//Emit to get the logs 
socket.emit("chat-get-log", {
        room_id: GLOBAL.room_id
});

var receivedChatFromServer = function(data) {
  var msgLogText = $('#chat-log').html() + "<br>" 
                      + data.username + ": " + data.chat_msg;
      $('#chat-log').html(msgLogText);
};



  socket.on('chat-message-log', function(data) {
      if (!GLOBAL.has_chat_log && data[0] && data[0].room_id == GLOBAL.room_id) {
         var chatMsgs = data;
            //console.log(data);
          for (var i =0; i<chatMsgs.length; i++){
            receivedChatFromServer(chatMsgs[i]);
          }
        GLOBAL.has_chat_log = true;
      }
 
    });






//RECEIVE CHAT MESSAGE ON CLIENT
  socket.on("chat-message-received", function (data) {
      receivedChatFromServer(data);
      
       //console.log(msgLogText);
    });

//Receive initial chat logs





//SEND CHAT MESSAGE TO THE SERVER

var sendChatMessageToServer = function() {    
        var msgText = $('#message-text-box').val();
        typeof(msgText);
        if (msgText && msgText != "\n" && msgText != "" && msgText != " "){
            socket.emit("chat-message-sent", {
                chat_msg: msgText, 
                username: GLOBAL.username,
                room_id: GLOBAL.room_id
            });

            $('#message-text-box').val('');
        }
 }

//////SEND UNDETECTED CHARACTER TO SERVER //////////////
var testChar = false;
var sendCharacterToServer = function(data) {
  testChar = !testChar;
  //Send test char
  data = {
    start_num_fingers: 5,
    end_num_fingers: (testChar) ? 0 : 2,
    room_id: GLOBAL.room_id,
    username: GLOBAL.username
  };

  socket.emit("undetected-character-sent", data);
}

 socket.on("detected-character-received", function (data) {
      var character = (data) ? data.name : "-";
      console.log('DETECTED CHAR: ' + data);
      if(data && character) {
        $('#detected-character-box').html(character);
      }
       //console.log(msgLogText);
    });






//////CLICK LISTENERS //////////////
$('#message-text-box').keyup(function(event) {
    var keycode = event.which;
    if (keycode === KEY_CODE.ENTER) {
        sendChatMessageToServer();
    }
});


 $("#message-send-button").click(function() {
    sendChatMessageToServer();
    var character = $('#message-text-box').val();
    sendCharacterToServer(character);
});








////////////// SCROLL TO DIV /////////////
    var wrapperDiv = "#wrapper";
    var wrapperAxis = {axis: 'y'};
    $("#nav-links").click(
        function(){
            console.log('scrolled!');
            $.scrollTo( '1200px', 1200, wrapperAxis);
        }
    );

//////////////////////////////


/////////WEB SOCKETS



// Support both the WebSocket and MozWebSocket objects
if ((typeof(WebSocket) == 'undefined') &&
    (typeof(MozWebSocket) != 'undefined')) {
  WebSocket = MozWebSocket;
}

// Create the socket with event handlers
function init() {
  //Create and open the socket
  ws = new WebSocket("ws://localhost:6437/");
  
  // On successful connection
  ws.onopen = function(event) {
    //document.getElementById("main").style.visibility = "visible";
    //document.getElementById("connection").innerHTML = "WebSocket connection open!";
  };
  
  // On message received
  ws.onmessage = function(event) {
    socket.emit("leap-data-message", event.data);

   // var obj = JSON.parse(event.data);
    //var str = JSON.stringify(obj, undefined, 2);
    //document.getElementById("output").innerHTML = '<pre>' + str + '</pre>';
  };
  
  // On socket close
  ws.onclose = function(event) {
    ws = null;
    //document.getElementById("main").style.visibility = "hidden";
    //document.getElementById("connection").innerHTML = "WebSocket connection closed";
     socket.emit("leap-data-message", {data: "CLOSED LEAP"});

  }
  
  //On socket error
  ws.onerror = function(event) {
    alert("Received error");
  };
}

init();
////////////////////////////////////////////////////////////










}); // Close Document.Ready() Function