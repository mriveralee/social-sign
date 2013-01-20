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

var myStartDate;


//// NICK'S LEAP CONNECTION VARIABLES

var ws;

var STANDARD_POS = 0;
var DELAY = 0;
var startDate = new Date();
var startTime;
var numFingersStart;
var numFingersFinish;
var GESTURE_REC_TIME = 3;

var FINGER_LENGTHS = [0,0,0,0,0];
var FINGER_X_LOC = [0,0,0,0,0];
var DELTA_FINGER_LENGTH = 15;
var DELTA_FINGER_X_LOC = 5;

var thumbLen;
var indexLen;
var middleLen;
var ringLen;


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
  var msgLogText = $('#chat-log').html() + "<br><span class='indent'>" 
                      + data.username + ": " + data.chat_msg+"</span>";
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
      if(data && character && character != '-' && data.sent_username != GLOBAL.username) {
        $('#detected-character').html(character);
         if (character && character != '' && character != ' ') {
            if(character == '-') {
              character = 'dash';
            }
            $('#detected-character-sign').html('<img class="sign-img" src="../images/signs/'+character.toLowerCase()+'.png">');
            $('#leap-character-status-box').html("Sign recognized!");
        }
      }
      else {
        $('#leap-character-status-box').html("No sign recognized.");
                 $('#detected-character-sign').html('<img class="sign-img" src="../images/signs/dash.png">');


      }
       //console.log(msgLogText);
    });


 socket.on("sent-character-received", function (data) {
      var character = (data) ? data.name : "-";
      console.log('DETECTED CHAR: ' + data);
      if(data && character) {
        $('#received-character').html(character);
        if (character && character != '' && character != ' ') {}
         if(character == '-') character = 'dash';
         $('#received-character-sign').html('<img class="sign-img" src="../images/signs/'+character.toLowerCase()+'.png">');
         $('#received-character-status-box').html("Sign received from " +data.from_user +"!");
      }
      else {
        $('#received-character-status-box').html("No sign received.");
                 $('#received-character-sign').html('<img class="sign-img" src="../images/signs/dash.png">');


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




/////////WEB SOCKETS FOR LEAP
// Support both the WebSocket and MozWebSocket objects
if ((typeof(WebSocket) == 'undefined') &&
    (typeof(MozWebSocket) != 'undefined')) {
  WebSocket = MozWebSocket;
}
var LEAP_CONNECTED = false;

// Create the socket with event handlers
function init() {
  //Create and open the socket
  ws = new WebSocket("ws://localhost:6437/");
  
  // On successful connection
  ws.onopen = function(event) {
    //document.getElementById("main").style.visibility = "visible";
    //$("#leap-status-box").html("Leap connected!");
  };
  
  // On message received
  ws.onmessage = function(event) {
    if(!LEAP_CONNECTED) {
       LEAP_CONNECTED= true;
       $("#leap-status-box").html("Leap connected!");
     }
    // var currentDate = new Date();
    // var currentTime = currentDate.getTime()/1000;
    // var timeElapsed = currentTime - myStartDate.getTime()/1000;
    // if (timeElapsed > 5) {
    //   timeElapsed = 0;
    //   myStartDate = new Date();
    //   socket.emit("leap-data-sent", event.data);
    // }


    var obj = JSON.parse(event.data);
    var str = JSON.stringify(obj, undefined, 2);

    // __________________ VARIABLES __________________
    
    var finger, palmVelocity, numFingers, palmNormal, palmPosition; 
      
      if( obj.hands)  {
        var hand0 = obj.hands[0];
        palmVelocity = (hand0) ? hand0.palmVelocity : [0,0,0];
        palmNormal = (hand0) ? hand0.palmNormal : [0, 0,0];
        palmPosition = (hand0) ? hand0.palmPosition :[0,0,0];
     }

      if ( obj.pointables ) {
        finger = obj.pointables[0];
        numFingers = (finger) ? obj.pointables.length : 0;
      }


    // __________________ DETECT STANDARD POSITION __________________

    if(!STANDARD_POS){
      //document.getElementById("status").innerHTML = '<h1>not standard pos</h1>';
      if( palmVelocity && (Math.abs(palmVelocity[0]) < 100) ){
        if(numFingers == 5){
          //if( (Math.abs(palmNormal[0]) < .2) && (Math.abs(palmNormal[1]) > .7) ){
           // document.getElementById("status").innerHTML = '<h1>STANDARD POS</h1>';
            var currentDate = new Date();
            startTime = currentDate.getTime()/1000;
            numFingersStart = 5;
            STANDARD_POS = 1;


            // __________________ SORT FINGERS __________________
            var fingerArray = [];

            for (var i = 0; i < numFingers; i++) {
              fingerArray.push(obj.pointables[i]);
            }


            for (var i = 0; i < numFingers; i++) {
                for (var j = i+1; j < numFingers; j++) {
                    if (fingerArray[i].tipPosition[0] > fingerArray[j].tipPosition[0]) {
                        var temp = fingerArray[i];
                        fingerArray[i] = fingerArray[j];
                        fingerArray[j] = temp;
                    }
                }
            }

            thumbLen = fingerArray[0].tipPosition[0] - palmPosition[0];
            indexLen = fingerArray[1].tipPosition[0] - palmPosition[0];
            middleLen = fingerArray[2].tipPosition[0] - palmPosition[0];
            ringLen = fingerArray[3].tipPosition[0] - palmPosition[0];
            pinkyLen = fingerArray[4].tipPosition[0] - palmPosition[0];

            // document.getElementById("sort").innerHTML = 'SORTED FINGERS<br>' + thumbLen + '<br>' + indexLen + '<br>' + middleLen + '<br>' + ringLen + '<br>' + pinkyLen;

            //Store sorted finger lengths 
            for (var i = 0; i < fingerArray.length; i++) {
              FINGER_LENGTHS[i] = fingerArray[i].length;
              FINGER_X_LOC[i] = fingerArray[i].tipPosition[0];
            }
            //console.log(FINGER_LENGTHS);




          //}
          //else{
          //  document.getElementById("status").innerHTML = '<h1>not standard pos</h1>';
          //}
        }
        else{
          $("leap-status-box").html('<em>Adjust hand to standard position.</em>');
        } 
      }
      else{
        $("#leap-status-box").html('<em>Adjust hand to standard position.</em>');
      } 
    }
    else{
      var currentDate = new Date();
      var timeSpent = (currentDate.getTime()/1000 - startTime);
        var timeRemaining = GESTURE_REC_TIME-timeSpent;
        
        $("#leap-status-box").html('<em>Please Position Your Gesture Now: </em><br>'+ (Math.round(timeRemaining*100)/100));

      if( timeSpent > GESTURE_REC_TIME){


        // _________________ CHECK WHICH FINGERS ARE LEFT _______________



        numFingersFinish = obj.pointables.length;
        //Fingers present at the end gesture 
        finishFingers = obj.pointables;
        //Boolean array of whether a finger is still present
        var fingers_present = [0,0,0,0,0];

          for (var i = 0; i < numFingersFinish; i++) {
            
            var bestMatch = 0; // finger_present number
            var bestMatchDiff = 100000000;
            
            for (var j = 0; j < fingers_present.length; j++) {
              var  diff = Math.abs(finishFingers[i].length - FINGER_LENGTHS[j]);
              if( diff <= DELTA_FINGER_LENGTH 
                  && fingers_present[j] == 0 
                  && diff <= bestMatchDiff ) {
                
                bestMatch = j;
                bestMatchDiff = diff;
              }
            }
            if (bestMatchDiff < 100000000) {
               fingers_present[bestMatch] = 1;
            }
          } 

        console.log('Fingers present: ' + fingers_present);

        // POST: [0, 1, 1, 0, 0]

         var characterData = { 
            start_num_fingers: numFingersStart,
            end_num_fingers: numFingersFinish,
            fingers_present: fingers_present,
            sent_username: GLOBAL.username
         }
        socket.emit('undetected-character-sent', characterData);
        DELAY = 0;
        STANDARD_POS = 0;
      }
    }
  };
   

  
  // On socket close
  ws.onclose = function(event) {
    ws = null;
    //document.getElementById("main").style.visibility = "hidden";
    //document.getElementById("connection").innerHTML = "WebSocket connection closed";
    
      socket.emit("leap-data-sent", {data: "CLOSED LEAP"});


  }
  
  //On socket error
  ws.onerror = function(event) {
    alert("Received error");
  };
}

//RECEIVE LEAP DATA
 socket.on("leap-data-received", function (data) {
     console.log(data);
    });


init();
////////////////////////////////////////////////////////////


/// VISUALIZER
var VISUALIZER= {h: '500', w:'300', canvas: 'leap-visualizer-box'};
 var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(30, VISUALIZER.w/VISUALIZER.w, 0.10, 1000);
      var renderer = new THREE.WebGLRenderer();
      renderer.setSize(VISUALIZER.w, VISUALIZER.w);

      //console.log(renderer.domElement);
      document.getElementById(VISUALIZER.canvas).appendChild(renderer.domElement); 
      camera.position.z = 500;
      camera.position.y = -100;
      camera.lookAt(new THREE.Vector3(20,400,-100))

      var fingers = {};
      var spheres = {};
      Leap.loop(function(frame) {
        var fingerIds = {};
        var handIds = {};
        for (var pointableId = 0, pointableCount = frame.pointables.length; pointableId != pointableCount; pointableId++) {
          var pointable = frame.pointables[pointableId];
          var finger = fingers[pointable.id]
          var origin = new THREE.Vector3(pointable.tipPosition[0], pointable.tipPosition[1], -pointable.tipPosition[2])
          var direction = new THREE.Vector3(pointable.direction[0], pointable.direction[1], -pointable.direction[2]);
          if (!finger) {
            finger = new THREE.ArrowHelper(origin, direction, pointable.length,  Math.random()*0x0f0f0f + 0xf0f0f0);
            fingers[pointable.id] = finger;
            scene.add(finger);
          } else {
            finger.position = origin
            finger.setDirection(direction)
          }
          finger.length = pointable.length
          fingerIds[pointable.id] = true
        }

        for (fingerId in fingers) {
          if (!fingerIds[fingerId]) {
            scene.remove(fingers[fingerId])
            delete fingers[fingerId]
          }
        }

        renderer.render(scene, camera);
      });




}); // Close Document.Ready() Function