var express = require('express');
var app = express();
var sunucu = app.listen('3000');
var io = require('socket.io').listen(sunucu);
var shortid = require('shortid');
var mysql = require('mysql');    

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
	user     : '',
	password : '',
	database : ''
});   

var clients = [];

console.log("sunucu aktif");
var connectedPlayers =0;
io.sockets.on('connection',function(socket){
              
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
                if(result_notif == ''){
                    console.log("arkadasi begenmedik ", result_notif);
                    return;
                }
                result_notif.toString().replace(/['"]+/g, '');
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
            app_id: "83ba78aa-e704-4392-a2f8-bbc0b",
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
            "score":0,
            "friends":""
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
        connection.query('SELECT *FROM userList WHERE username = ?',username,function(error,results,fields){
            if(error){
                console.log('error to listing friends');
            }
            else{
                var friend = [];
                friend.push(results[0].friends);
                socket.join(username);
                io.sockets.to(username).emit('ListFriendsSuccess',{"friends":friend});
                if(clients[username] == null){
                    console.log("clients username null verdilaaan");
                }
                console.log(friend);
            }
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
            io.sockets.to(username).emit('MatchCreated',{"roomNum":name});
            console.log("bekleyen kişi yok, kurulan oda: ",name);
		//console.log(WaitingRooms.length);
        }
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

    socket.on('FirstMove',function(data){
        socket.broadcast.to(data["from"]).emit('move',data);
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
