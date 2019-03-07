var express = require('express');
var app = express();
var sunucu = app.listen('4567');
var io = require('socket.io').listen(sunucu);

console.log("sunucu aktif");

io.on('connection',function(socket){

    console.log("birileri bağlandı :/");

    socket.on('FirstMove',function(data){
        socket.broadcast.emit('move',data);
    });

    socket.on('BallPos',function(data){
        socket.broadcast.emit('FirstPos',data);
    });

    socket.on('BallMove',function(data){
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