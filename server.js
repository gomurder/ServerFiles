var express = require('express');
var app = express();
//var Stopwatch = require('node-stopwatch').Stopwatch;
var sunucu = app.listen('3000');
var io = require('socket.io').listen(sunucu);
var shortid = require('shortid');
//var mysql = require('mysql');    
/*
var stopwatch = Stopwatch.create();
stopwatch.start();
console.log("ticks: " , stopwatch.elapsedTicks);
console.log("miliseconds: " , stopwatch.elapsedMilliseconds);
console.log("seconds: " , stopwatch.elapsed.seconds);
console.log("minutes: " , stopwatch.elapsed.minutes);
console.log("hours: " , stopwatch.elapsed.hours);*/
var Character = function(username)
{
    this.id = username;
	this.speed = 1000;
	this.positionBuffer = [];
    this.positionBufferLimit = 1000;
    
    this.getLastPosition = function()
    {
       return this.positionBuffer[0];
    }

    this.validatePosition = function(data, deltaTime)
    {
        var isNull = this.getLastPosition();
        
        var deltaX = data["posx"];
        var deltaY = data["posy"];
        
        var normalizedX = deltaX / (this.speed * deltaTime);
        var normalizedY = deltaY / (this.speed * deltaTime);
        
        var magnitude = Math.sqrt( Math.pow(normalizedX, 2) + Math.pow(normalizedY, 2) );

        
        if( (magnitude >= 0.990 && magnitude <= 1.001) || (magnitude >= -0.001 && magnitude <= 0.001))
            return true;
        else
            return false;
    }
    
    this.setNewPosition = function(data)
    {
        this.positionBuffer.push({x:data["posx"], y:data["posy"]});
        if(this.positionBuffer.length >= this.positionBufferLimit)
        {
            console.log("setnewpos basladi");
            var savedPositions = this.positionBuffer.slice(1, this.positionBuffer.length);
            this.positionBuffer = savedPositions;
            console.log("setnew position bitti");
        }
    }
}

var WaitingRooms = [];
var PlayingRooms = [];

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

var connection = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	password : '',
	database : 'static'
});   
var clients = [];
var pingRates = {};
console.log("sunucu aktif");
var connectedPlayers =0;
io.sockets.on('connection',function(socket){
    /*setInterval(() => {
        var a = Date.now();
        socket.emit('post',function(){
            console.log("acked");
            socket.emit('pingRated',{"ping":(Date.now() - a)});
        });
    },1000);*/
    socket.on('TestForce',function(data){
        /*setInterval(() => {
            console.log('withterwal');
            for(var i = 0; i < 50; i++){
                console.log("sending, datenow: ",Date.now());
                    socket.emit('ASASFfsasafs');
                }
            socket.emit('withterwal');
        }, 5);*/
    });
    
socket.on('ping', function(ms){
    socket.emit('pong');
});

socket.on('bifortest',function(data){
    console.log("bifor Trap, ip: ",data["target"]);
    
    socket.broadcast.emit('receivedBifor',data);
});
   console.log(WaitingRooms, " ", PlayingRooms);

    socket.on('OpenedNotification',function(data){
        console.log("asasf");
        var username = data["id"];
        var name = data["username"];
        if(WaitingRooms.indexOf(username)==null){
            console.log("kullanıcı sizi beklemiyor.");
            socket.join(name);
            io.sockets.to(name).emit('HandlePlayError');
        }else{
            //io.sockets.to(username).emit('AcceptedRequest',{"username":name,"roomName":name});
            //io.sockets.to(name).emit('AcceptSuccess',{"username":username});
            WaitingRooms.splice(WaitingRooms.indexOf(username));
            PlayingRooms.push(name);
        }
    });

    socket.on('TestingSome',function(data){
        console.log("alo");
        var notification = data["id"];
        var username = data["username"];
        let datas = [notification,username];
        console.log(notification, " ", username);
        if(username == ''){
            console.log("username bos");
            return;
        }

        connection.query('SELECT *FROM userlist WHERE username = ?',username,function(error,results,fields){
            console.log("seciliyor");
            if(error){
                console.log("select notif_id returns error");
            }else{
                console.log("select basarili");
                var result_notif = results[0].notification_id;
                notification.toString().replace(/['"]+/g, '');
                console.log("1");
                if(result_notif == notification) {
                    console.log("notification id is didnt change...");
                    return;
                }
                console.log(result_notif , " ", notification);
                connection.query('UPDATE userlist SET notification_id = ? WHERE username = ?',datas,function(error,results,fields){
                    if(error){
                        console.log("update notif_id returns some errors !");
                    }else{
                        console.log("update notif_id success!");
                    }
                });
            }
        });
    });

      socket.on('SendNotifToMe',function(data){
          
          var trmsg = data["message"];
          var enmsg = data["enmessage"];

          var idlist = data["id"];
          console.log(other);

          idlist = idlist.replace(/['"]+/g, '');
        
          
          var message = { 
            app_id: "83ba78aa-e704-4392-a2f8-bbc0b235632d",
            subtitle:subtit,
            contents: {"en": enmsg,
            "tr":trmsg},
            include_player_ids: [idlist]
          };
          console.log("send notification is success...");
          sendNotification(message);
      });

      socket.on('SendNotification',function(data){

        var target = data["target"];
        var trmsg = data["trmessage"];
        var enmsg = data["enmessage"];
        var subtit = data["myusername"];
        var idlist;
        connection.query('SELECT *FROM userlist WHERE username = ?',target,function(error,results,fields){
            if(error){
                console.log("error");
            }
            idlist = results[0].notification_id;
            idlist.toString().replace(/['"]+/g, '');
            console.log(trmsg, " ", enmsg);
        var message = { 
            app_id: "83ba78aa-e704-4392-a2f8-bbc0b235632d",
            title:target,
            contents: {"en": enmsg,
            "tr": trmsg},
            include_player_ids: [idlist]
          };
          console.log("send notification is success...");
          sendNotification(message);
          });
      });

    socket.on('Register',function(data){
        dataUser = {
            "username":data["username"],
            "password":data["password"],
            "email":data["email"],
            "friends":"",
            "friend_request":"",
            "gold":0,
            "diamond":0,
            "notification_id":data["not_id"],
            "active":"true"
        }
        console.log(dataUser);
        connection.query('SELECT * FROM userlist WHERE username = ?',dataUser.username,function(error,results,fields)
        {
            if(results.length > 0){
                        var tickName = shortid.generate();
                        socket.join(tickName);
                        io.sockets.to(tickName).emit('RegisterErrorExist');
                        socket.leave();
                        console.log('error to register');
                console.log("register is returns some errors ");
            }else{
                    connection.query('INSERT INTO userlist SET ?',dataUser,function(error,results,fields){
                    if(error)
                    {
                        var tickName = shortid.generate();
                        socket.join(tickName);
                        io.sockets.to(tickName).emit('RegisterErrorExist',{"asdsda":"sfasaf"});
                        socket.leave();
                        console.log('error to register');
                    }
                    else{
                        
                        socket.join(dataUser.username);
                        io.sockets.to(dataUser.username).emit('RegisterSuccess',{"username":dataUser.username,"password":dataUser.password});
                        console.log('registered user.');
                    }
                    });
                }
    });

    });

    
    
    socket.on('Login',function(data){

        var username = data["username"];
        var password = data["password"];
        connection.query('SELECT * FROM userlist WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
                socket.join(username);
                io.sockets.to(username).emit('LoginSuccess',{"username":username,"password":password});
				console.log("giriş yapıldı");
			} else {
                var tickName = shortid.generate();
                socket.join(tickName);
                io.sockets.to(tickName).emit('LoginError');
                socket.leave();
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
                io.sockets.to(myusername).emit('FindedPlayer',{"username":username,"already":"true"});
            }
            else{
                console.log("listelendi...");
                var friends = [];
                friends.push(results);
                io.sockets.to(myusername).emit('FindedPlayer',{"friends":friends,"already":"false"});
            }
        });

    });

    socket.on('AddFriend',function(data){
        var username = data["username"];
        var myusername = data["myusername"];
        var datas = [myusername,username];
        console.log(datas);
        connection.query('UPDATE userlist SET friend_request = ? WHERE username = ?',datas,function(error,results,fields){
            if(error){
                io.sockets.to(username).emit('AddFriendFailed');
                console.log("error to add friend");
            }else{
                console.log("kullanıcıya istek gönderildi");
                io.sockets.to(username).emit('AddFriendSuccess',{"username":username});
            }
        });
    });

    socket.on('AcceptFriend',function(data){

        var myusername = data["myusername"];
        var username = data["username"];
        var oldfriends = [];
        var oldrequests = [];
        let datas = [oldfriends,oldrequests,username];
        console.log(datas);
        connection.query('SELECT *FROM userlist WHERE username = ?',username,function(error,results,fields){
            if(error){
                console.log('error oldu knk');
            }else{
                
            
            oldfriends.push(results.friends);
            if(oldfriends.indexOf(username) == null){
                return;
            }
            oldrequests.push(results.friend_request);
            if(oldrequests.indexOf(username) != null){
                var rindex = oldrequests.indexOf(username);
                oldrequests.splice(rindex,1);
                connection.query('UPDATE friends = ?, friend_request = ? FROM userlist WHERE username = ?',datas,function(error,results,fields){
                    if(error){
                        console.log('update hata verdi');
                    }else{
                        console.log('gayet başarılı');
                    }
                });
            }
            else{
                console.log("null falan filasn işte hata");
            }
            }
        });
        
    });

    
    socket.on('PlayWithFriend',function(data){
        var username = data["username"];
        var myusername = data["myusername"];
        var delname;
        var sil;
        console.log('sss');
        io.sockets.to(username).emit('PlayRequest',{"username":myusername});
        if(WaitingRooms.indexOf(username)==null){
            io.sockets.to(myusername).emit('PlayRequestFailed');
            return;
        }else{
            WaitingRooms.push(myusername);
        }
    });

    socket.on('AcceptRequest',function(data){
        var requestname = data["username"];
        var username = data["myusername"];
        console.log(username, " ", requestname);
        if(WaitingRooms.indexOf(requestname)==null){
            io.sockets.to(username).emit('AcceptRequestFailed');
        }
        else{
            var sp = WaitingRooms.indexOf(requestname);
            WaitingRooms.splice(sp,1);
            PlayingRooms.push(requestname);
            console.log("spliced, waitingrooms: ",WaitingRooms, " playingRooms: ",PlayingRooms);
            socket.join(requestname);
            //socket.broadcast.to(requestname).emit('AcceptedRequest',{"username":username,"roomName":requestname});
            io.sockets.to(requestname).emit('AcceptSuccess',{"username":username,"roomName":requestname});
        }
    });

    socket.on('CancelRequest',function(data){
        var username = data["username"];
        var sp = WaitingRooms.indexOf(username);
        WaitingRooms.splice(sp,1);
        io.sockets.to(username).emit('RequestCancelled');
    }); 
    
    socket.on('ResumeGame',function(data){
        clearInterval(intval);
        io.sockets.to(data["name"]).emit('GameResumed');
    });
    var intval;
    socket.on('StopGame',function(data){
       
        intval = setInterval(() => {
            io.sockets.to(data["name"]).emit('kalanzaman');
          }, 1000);

    });



    socket.on('ListFriends',function(data){
        var username = data["username"];
        connection.query('SELECT *FROM userlist WHERE username = ?',username,function(error,results,fields){
            var isActive = [];
            if(error){
                console.log('error to listing friends');
            }
            else{
                var friend = [];
                
                friend.push(results[0].friends);
                var splitFriend=[];
                splitFriend= friend[0].split(",");
                console.log(splitFriend.length," asfasfasffas ", splitFriend[1]);
                for (var i = 0; i < splitFriend.length; i++){
                    console.log("lanfor ", i);
                    connection.query('SELECT *FROM userlist WHERE username =?',splitFriend[i],function(error,sresults,fields){
                        isActive.push(sresults[0].active.toString());
                        console.log("geliyorr ",isActive);
                        io.sockets.to(socket.id).emit('ListFriendsSuccess',{"friends":friend,"active":isActive});
                        console.log("isactive: ",isActive);
                });
                }
                console.log("bitti");
               
                
            }
            console.log("yeni ", isActive);
        });
    });
    
    socket.on('QuickMatch',function(data){
        var username = data["username"];
		if(WaitingRooms.length >= 1){
			console.log("Odaya Katılıyoruz");
			var quickRoom = WaitingRooms[Math.floor(Math.random()*WaitingRooms.length)];
            socket.join(quickRoom);
            console.log(quickRoom);
            //socket.to(quickRoom).emit('roomNum',{"roomNo":quickRoom});
            io.sockets.to(quickRoom).emit('MatchFind',{"roomNum":quickRoom});
            socket.broadcast.to(quickRoom).emit('UsernameForMatch',{"username":username});
            io.sockets.to(socket.id).emit('UsernameForMatch',{"username":quickRoom});
            console.log("girdiğiniz oda: ",quickRoom);
            var qindex = WaitingRooms.indexOf(quickRoom);
            WaitingRooms.splice(qindex,1);
            PlayingRooms.push(quickRoom);
            console.log("waitin: ",WaitingRooms);
            console.log("playin: ",PlayingRooms);
		}
		else{
			WaitingRooms.push(username);
            socket.join(username);
            io.sockets.to(username).emit('MatchCreated',{"roomNum":username});
            console.log("bekleyen kişi yok, kurulan oda: ",username);
		//console.log(WaitingRooms.length);
        }
    });

    socket.on('CheckLogged',function(data){
        /*var username = data["username"];
        var password = data["password"];
        let datas = [username,password];
        connection.query('SELECT *FROM userlist WHERE username = ? AND password = ?',datas,function(error,results,fields){
            if(error){
                io.sockets.to(socket.id).emit('CheckingLoggedisFailed');
            }
            else{
                var gold = results[0].gold;
                var diamond = results[0].diamond;
                io.sockets.to(socket.id).emit('CheckingLoggedisSuccess',{"username":username,"password":password,"gold":gold,"diamond":diamond});
            }
        });*/
    });

    connectedPlayers++;
    console.log("Bağlantı Sağlandı, Online " , connectedPlayers, " Kişi var.");

    socket.on('Winner',function(data){
        io.sockets.to(data["from"]).emit('WinnerChoosed',data);
    });

    socket.on('chatMessage',function(data){
        socket.broadcast.to(data["from"]).emit('ChatReceive',data);
    });

    socket.on('enablesprite',function(data){
        socket.broadcast.to(data["from"]).emit('kicksprite',data);
    });

    socket.on('ChangingVelocity',function(data){
        socket.broadcast.to(data["from"]).emit('VelocityChanged',data);
    });

    socket.on('SelectTeam',function(data){
        console.log(data);
        socket.broadcast.to(data["from"]).emit('TeamSelected',data);
    });

    socket.on('FidrstMove',function(data){
        console.log(data);
        var newdata = {
            "x": data["posx"],
            "y": data["posy"]
        }
        socket.broadcast.to(data["from"]).emit('move',newdata);
    });

    socket.on('FirstMove', function(data)
	{
		var roomName = data["from"];
            var character = new Character(roomName);
		
			var deltaTime = 0.02;
	        var newCharacterState = {};
            var isNewPositionValid = character.validatePosition(data, deltaTime);
            

            if(isNewPositionValid)
            {
                character.setNewPosition(data);
                newCharacterState = {x: data["posx"], y: data["posy"]};
                console.log("new postiion is valid");
            	socket.broadcast.to(roomName).emit('move', newCharacterState);
            }
            else
            {
                character.setNewPosition(data);
                var def = character.getLastPosition();
                if(def == undefined) return;
                newCharacterState = {
                    x: def.x,
                    y: def.y
                };

                socket.broadcast.to(roomName).emit('move', newCharacterState);
            	io.sockets.to(socket.id).emit('meMove', newCharacterState);                
            }
        });

    socket.on('sendgoal',function(data){
        io.sockets.to(data["from"]).emit('goal',data);
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
        if(WaitingRooms.indexOf(name) != null){
            var waitDex = WaitingRooms.indexOf(name);
            WaitingRooms.splice(waitDex,1);
        }
        if(PlayingRooms.indexOf(name)!=null){
            var thisDex = PlayingRooms.indexOf(name);
            PlayingRooms.splice(thisDex,1);
        }
        socket.leave(PlayingRooms[name]);
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
