console.log("I WORK!");


$(document).ready(function() {


    var wrapperDiv = "#wrapper";
    var wrapperAxis = {axis: 'y'};
    $("#nav-links").click(
        function(){
            console.log('scrolled!');
            $.scrollTo( '1200px', 1200, wrapperAxis);
        }
    );










}); // Close Document.Ready() Function