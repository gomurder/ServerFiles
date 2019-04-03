var express = require('express');
var app = express();
var sunucu = app.listen('3000');
var io = require('socket.io').listen(sunucu);
var shortid = require('shortid');
var mysql = require('mysql');

var WaitingRooms = [];
var PlayingRooms = [];

var connection = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	password : '',
	database : 'static'
});

var users = {
    "username":"isframe",
    "password":"redeneme",
    "score":10
}

connection.query('SELECT *FROM userList WHERE username = "isframe"',function(error,results,fields){
    if(error){
        console.log('error');
        return;
    }
    else{
        var tt = [];
        //tt = JSON.parse(results);
        tt.push(results[0].friends);
        //tt.slice(",");
        console.log(tt);
    }
});

/*connection.query('INSERT INTO userList SET ?',users,function(error,results,fields){
    if(error){
        console.log("anaskm");
    }
    console.log("test");
});*/


console.log("sunucu aktif");
var connectedPlayers =0;
io.on('connection',function(socket){

    /*var thisClientId = shortid.generate();
	socket.join(thisClientId);
	io.to(thisClientId).emit('merhaba',{"id":thisClientId});
    socket.leave();*/

    socket.on('Register',function(data){
        dataUser = {
            "username":data["username"],
            "password":data["password"],
            "email":data["email"],
            "score":0
        }
        connection.query('SELECT * FROM userList WHERE username = ?',dataUser.username,function(error,results,fields)
        {

            if(results.length > 0){
                console.log("register is returns some errors");
            }else{
                    connection.query('INSERT INTO userList SET ?',dataUser,function(error,results,fields){
                    if(error)
                    {
                        var tickName = shortid.generate();
                        socket.join(tickName);
                        io.to(tickName).emit('RegisterError');
                        socket.leave();
                        console.log('error to register');
                    }
                    else{
                        var tickName = shortid.generate();
                        socket.join(tickName);
                        io.to(tickName).emit('LoginSuccess',{"username":username,"password":password});
                        socket.leave();
                        console.log('registered user.');
                    }
                    });
                }
    });

    });

    socket.on('Login',function(data){

        var username = data["username"];
        var password = data["password"];
        connection.query('SELECT * FROM userList WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
                socket.join(username);
                io.to(username).emit('LoginSuccess',{"username":username,"password":password});
                socket.leave();
				console.log("giriş yapıldı");
			} else {
                var tickName = shortid.generate();
                socket.join(tickName);
                io.to(tickName).emit('LoginError');
				console.log("kullanıcı adı ya da şifre yanlış!");
			}			
		});
    });

    socket.on('UpdateScore',function(data){
        let datas =[data["score"],data["username"]];
        connection.query('UPDATE userlist SET score = ? WHERE username = ?',datas,function(error,results,fields){
            if(error){
                console.log("error");
            }
            else{
                console.log("success! Result: ",results);
            }
        });

    });

    socket.on("FindPlayer",function(data){

        var myusername = data["myusername"];
        var username = data["username"];
        connection.query('SELECT *FROM userList WHERE username = ?',username,function(error,results,fields){
            if(error){
                console.log("error!");
            }
            else{
                var friends = [];
                friends.push(results[0].friends);
                socket.join(myusername);
                io.to(myusername).emit('FindedPlayer',{"friends":friends});
                socket.leave();
            }
        });

    });

    socket.on('AddFriend',function(data){

        var addUser = data["remoteUser"];
        var username = data["username"];
        connection.query('UPDATE')

    });

    socket.on('ListFriends',function(data){
        var username = data["username"];
        connection.query('SELECT *FROM userList WHERE username = ?',username,function(error,results,fields){
            if(error){
                console.log('error to listing friends');
            }
            else{
                var friend = [];
                socket.leave();
                friend.push(results[0].friends);
                socket.join(username);
                var len = friend.length;
                io.to(username).emit('ListFriendsSuccess',{"friends":friend,"count":friend.length});
                console.log(friend);
            }
        });
    });
    
    socket.on('QuickMatch',function(data){
		//socket.join(data);
		//socket.to(data["id"]).emit('quickAppend',{"msg":"Kuyruğa Eklendiniz"});
		//WaitingRooms.push(data);
		if(WaitingRooms.length >= 1){
			console.log("Odaya Katılıyoruz");
			var quickRoom = WaitingRooms[Math.floor(Math.random()*WaitingRooms.length)];
            socket.join(quickRoom);
            //socket.to(quickRoom).emit('roomNum',{"roomNo":quickRoom});
			io.to(quickRoom).emit('MatchFind',{"roomNum":quickRoom});
            console.log("girdiğiniz oda: ",quickRoom);
		}
		else{
            var name = shortid.generate();
			WaitingRooms.push(name);
            socket.join(name);
            io.to(name).emit('MatchCreated',{"roomNum":name});
            console.log("bekleyen kişi yok, kurulan oda: ",WaitingRooms[name]);
		//console.log(WaitingRooms.length);
        }
    });

    connectedPlayers++;
    console.log("Bağlantı Sağlandı, Online " , connectedPlayers, " Kişi var.");

    socket.on('FirstMove',function(data){
        socket.broadcast.to(data["from"]).emit('move',data);
    });

    socket.on('sendgoal',function(data){
        socket.broadcast.to(data["from"]).emit('goal',data);
    });

    socket.on('BallPos',function(data){
        socket.broadcast.to(data["from"]).emit('FirstPos',data);
    });

    socket.on('BallMove',function(data){
        socket.broadcast.to(data["from"]).emit('BallMoving',data);
        console.log("kick data: ",data);
    });

    socket.on('BallTest',function(data){
        socket.broadcast.to(data["from"]).emit('testreceive',data);
    });
    
    socket.on('Quiting',function(data){
        var name = data["name"];
        var thisDex = PlayingRooms.indexOf(name);
        socket.leave(PlayingRooms[name]);
        PlayingRooms.splice(thisDex,1);
        socket.broadcast.to(data["name"]).emit('exLove',data);
    });

    //  FirstReppingBall
    // BallRep

    socket.on('BallRep',function(data){
        socket.broadcast.to(data["from"]).emit('FirstReppingBall',data);
        console.log("Collision: ",data);
    });

    socket.on('disconnect',function(cb){
        console.log("birisi çıktı gitti");
        connectedPlayers --;
    });

});
