/**
 * Created by Pratik on 10/30/2017.
 */

module.exports = function (app) {
    // Will be called when user connects to the socket. Will be called for every user.

    app.io.on('connection', function (socket) {
        console.log("socket="+socket);
        console.log("user Connected.");
        socket.on('chat message', function(msg){
            app.io.emit('chat message', msg);
        });
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
    });
}