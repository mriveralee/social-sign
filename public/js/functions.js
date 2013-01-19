
var GLOBAL = {};
  GLOBAL.username = "User " + parseInt(Math.round(Math.random()*112764+13));
  //Gets room id from url
  GLOBAL.room_id = (document.URL).replace(/^.*room\//, "");

//KEY PRESS
var KEY_CODE = {
    ENTER: 13

};


$(document).ready(function() {

/////SOCKET IO //////////////////////////
 var socket = io.connect(window.location.hostname);
  ///Input from server
    socket.on("news", function (data) {
      console.log(data);
      socket.emit("my other event", { my: "data" });
    });



//RECEIVE CHAT MESSAGE ON CLIENT
    socket.on("chat-message-received", function (data) {

      var msgLogText = $('#chat-log').html() + "<br>" 
                    + data.username + ": " + data.chat_msg;
      $('#chat-log').html(msgLogText);
       //console.log(msgLogText);
    });



//////CLICK LISTENERS //////////////


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

$('#message-text-box').keyup(function(event) {
    var keycode = event.which;
    if (keycode === KEY_CODE.ENTER) {
        sendChatMessageToServer();
    }
});


 $("#message-send-button").click(function() {
    sendChatMessageToServer()
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










}); // Close Document.Ready() Function