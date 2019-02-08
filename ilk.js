var express = require('express');
var app = express();
var sunucu = app.listen('4000');
var io = require('socket.io').listen(sunucu);
var yol = require('path');
var shortid = require('shortid');
//var mysql = require('mysql');

var roomNum;
  var playerCount = 0;
io.on('connection',function(socket){
	var thisClientId = shortid.generate();
	//socket.emit("yourid",thisClientId);
	//socket.emit(thisClientId,"spawn");
	
	playerCount++;
	console.log("Bağlantı Sağlandı, Oyuncu sayısı = ",playerCount);
/*	socket.broadcast.emit('spawn',{id:thisClientId});
	for(i = 0; i < playerCount; i++)
	{
		socket.emit('spawn',{id:thisClientId});
		console.log(thisClientId," Oyuncusu Spawnlandı");
	}*/

	socket.on('move',function(data){
		socket.broadcast.emit('FirstMove',data);
	});

	socket.on('action',function(data){
		console.log("action data:  ",data);
	});

	socket.on('spawn',function(data){
		console.log("Oyuncu Spawnlanıyor");
	});
	
	socket.on('findMatch',function(callback){
		console.log(roomNum);

	});

	socket.on('ReadyBoost',function(data){
		socket.broadcast.emit('FirstBoost');
	});

	socket.on('MoveThat',function(data){
		socket.broadcast.emit('BoostMove',data);
	});

	socket.on('disconnect',function(data){
		console.log("oyuncu oyundan çıktı");
		playerCount--;
	});

});

//io.sockets.on('123').emit('roomMessage','merhaba kardşeim oldu galiba');
//io.sockets.on('123',function(cb){console.log("selam kankaa");});

  /*socket.on("joinRoom", room => {
	console.log("Joining Room...: " + room);
	if (registeredRooms.includes(room)) {
	  //Socket has joined the request room
	  return socket.emit("success", "Invalid Room Name: " + room);
	} else {
	 //No room with the specified Name! (or it could be another reason).
	 return socket.emit("err", "Invalid Room Name: " + room);
	}
  });*/

console.log("Sunucu Aktif");
