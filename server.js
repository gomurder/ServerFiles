var express = require('express');
var app = express();
var sunucu = app.listen('4567');
var io = require('socket.io').listen(sunucu);

console.log("sunucu aktif");
var connectedPlayers =0;
io.on('connection',function(socket){
    connectedPlayers++;
    console.log("Bağlantı Sağlandı, Online " , connectedPlayers, " Kişi var.");
    for(var i = 0; i<1;i++){
        socket.emit('spawn');
    }
    socket.on('FirstMove',function(data){
        socket.broadcast.emit('move',data);
    });

    socket.on('BallPos',function(data){
        socket.broadcast.emit('FirstPos',data);
    });

    socket.on('BallMove',function(data){
        socket.broadcast.emit('BallMoving',data);
    });
    socket.on('goal',function(data){
        socket.broadcast.emit('BallMoving',data);
    });
    //  FirstReppingBall
    // BallRep

    socket.on('BallRep',function(data){
        socket.broadcast.emit('FirstReppingBall',data);
    });

    socket.on('disconnect',function(cb){
        console.log("birisi çıktı gitti");
    });

});
