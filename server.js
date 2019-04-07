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
	user     : '',
	password : '',
	database : ''
});   

console.log("sunucu aktif");
var connectedPlayers =0;
io.on('connection',function(socket){

      socket.on('testpush',function(callback){
          var idlist = callback["id"];
        idlist = idlist.replace(/['"]+/g, '');
        var sendNotification = function(data) {
            var headers = {
              "Content-Type": "application/json; charset=utf-8"
            };
            
            var options = {
              host: "onesignal.com",
              port: 443,
              path: "/api/v1/notifications",
              method: "POST",
              headers: headers
            };
            
            var https = require('https');
            var req = https.request(options, function(res) {  
              res.on('data', function(data) {
                console.log("Response:");
                console.log(JSON.parse(data));
              });
            });
            
            req.on('error', function(e) {
              console.log("ERROR:");
              console.log(e);
            });
            
            req.write(JSON.stringify(data));
            req.end();
          };
          
          var message = { 
            app_id: "83ba78aa-e704-4392-a2f8-",
            contents: {"en": "test",
        "tr":"Static Apps iyi oyunlar diler"},
            include_player_ids: [idlist]
          };
          console.log(idlist);
          sendNotification(message);
      });

    socket.on('Register',function(data){
        dataUser = {
            "username":data["username"],
            "password":data["password"],
            "email":data["email"],
            "score":0,
            "friends":"",
            "friend_request":""
        }
        console.log(dataUser);
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

    socket.on('ResumeGame',function(data){
        clearInterval(intval);
        io.to(data["name"]).emit('GameResumed');
    });
    var intval;
    socket.on('StopGame',function(data){
       
        intval = setInterval(() => {
            io.to(data["name"]).emit('kalanzaman');
          }, 1000);

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
        connection.query('SELECT friends FROM userList WHERE username = ?',username,function(error,results,fields){
            if(results > 0){
                console.log("the user is already your friend");
                socket.join(myusername);
                io.to(myusername).emit('FindedPlayer',{"username":username,"already":"true"});
                socket.leave();
            }
            else{
                console.log("listelendi...");
                socket.join(myusername);
                io.to(myusername).emit('FindedPlayer',{"friends":friends,"already":"false"});
                socket.leave();
            }
        });

    });

    socket.on('AddFriend',function(data){
        var username = data["username"];
        var myusername = data["myusername"];
        var datas = [mysuername,username];
        console.log(datas);
        connection.query('UPDATE userlist SET friend_request = ? WHERE username = ?',datas,function(error,results,fields){
            if(error){
                console.log("error to add friend");
            }else{
                console.log("kullanıcıya istek gönderildi");
                socket.join(myusername);
                io.to(myusername).emit('AddFriendSuccess',{"username":username});
                socket.leave();
            }
        });

    });

    socket.on('ListFriends',function(data){
        var username = data["username"];
        connection.query('SELECT *FROM userList WHERE username = ?',username,function(error,results,fields){
            if(error){
                console.log('error to listing friends');
            }
            else{
                var friend = [];
                friend.push(results[0].friends);
                socket.join(username);
                var len = friend.length;
                io.to(username).emit('ListFriendsSuccess',{"friends":friend,"count":friend.length});
                console.log(friend);
            }
        });
    });
    
    socket.on('QuickMatch',function(data){

		if(WaitingRooms.length >= 1){
			console.log("Odaya Katılıyoruz");
			var quickRoom = WaitingRooms[Math.floor(Math.random()*WaitingRooms.length)];
            socket.join(quickRoom);
            //socket.to(quickRoom).emit('roomNum',{"roomNo":quickRoom});
            io.to(quickRoom).emit('MatchFind',{"roomNum":quickRoom});
            socket.leave();
            console.log("girdiğiniz oda: ",quickRoom);
		}
		else{
            var name = shortid.generate();
			WaitingRooms.push(name);
            socket.join(name);
            io.to(name).emit('MatchCreated',{"roomNum":name});
            socket.leave();
            console.log("bekleyen kişi yok, kurulan oda: ",name);
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
    });

    socket.on('disconnect',function(cb){
        console.log("birisi çıktı gitti");
        connectedPlayers --;
    });

});
