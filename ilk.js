var express = require('express');
var app = express();
var sunucu = app.listen('4000');
var io = require('socket.io').listen(sunucu);
var shortid = require('shortid');

  
var WaitingRooms = ["yar"];
var rooms = [0,1];
var roomNum;
  var playerCount = 0;
  var thisDex;
io.on('connection',function(socket){
	var thisClientId = shortid.generate();
	socket.join(thisClientId);
	io.to(thisClientId).emit('merhaba',{"id":thisClientId});
	socket.leave();
	socket.on('QuickMatch',function(data){
		//socket.join(data);
		//socket.to(data["id"]).emit('quickAppend',{"msg":"Kuyruğa Eklendiniz"});
		//WaitingRooms.push(data);
		if(WaitingRooms.length >= 1){
			console.log("Odaya Katılıyoruz");
			var quickRoom = WaitingRooms[Math.floor(Math.random()*WaitingRooms.length)];
			
			socket.join(quickRoom);
			io.to(quickRoom).emit('QuickSuccess',{"roomid":quickRoom});
			console.log("girdiğiniz oda: ",quickRoom);
		}
		else{
			WaitingRooms.push(data);
			socket.join(WaitingRooms[0]);
			console.log("bekleyen kişi yok, kurulan oda: ",WaitingRooms[0]);
		//console.log(WaitingRooms.length);
		}
		//io.to(thisClientId).emit('testing',{"msg":"test başarılı"});
	});
	//socket.emit("yourid",thisClientId);
	//socket.emit(thisClientId,"spawn");
	
	playerCount++;
	console.log("Bağlantı Sağlandı, Oyuncu sayısı = ",playerCount);

	socket.on('exitRoom',function(data){
		thisDex = WaitingRooms.indexOf(data);
		WaitingRooms.splice(thisDex,1);
	});

	socket.on('move',function(data){
		socket.broadcast.to(WaitingRooms[0]).emit('FirstMove',data);
	});

	socket.on('spawn',function(data){
		console.log("Oyuncu Spawnlanıyor");
	});
	
	socket.on('findMatch',function(callback){
		console.log(roomNum);

	});

	socket.on('ReadyBoost',function(data){
		socket.broadcast.to(WaitingRooms[0]).emit('FirstBoost');
	});

	socket.on('MoveThat',function(data){
		socket.broadcast.to(WaitingRooms[0]).emit('BoostMove',data);
	});

	socket.on('disconnect',function(data){
		console.log("oyuncu oyundan çıktı");
		playerCount--;
	});

});

console.log("Sunucu Aktif");
