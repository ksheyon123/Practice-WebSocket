var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var static = require('serve-static');
var socketio = require('socket.io');
var cors = require('cors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Views template html -> ejs 설정
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set("/views", static(path.join(__dirname, 'views')));

//Router 설정
var mainRouter = require('./routes/routes');

app.use(mainRouter);

var server = app.listen(3000, '192.168.0.40',  function() {
    console.log('http://192.168.0.40:3000');
});

var io = socketio.listen(server);
console.log('socket.io 요청을 받아들일 준비가 되었습니다.');

var login_ids = {};

io.sockets.on('connection', (socket) => {
    console.log('connection info : ', socket.request.connection._peername);

    socket.remoteAddress = socket.request.connection._peername.address;
    socket.remotePort = socket.request.connection._peername.port;

    socket.on('message', (message) => {
        console.log('message 이벤트를 받았습니다.');
        console.dir(message);

        if(message.recepient == 'ALL') {
            console.dir('나를 포함한 모든 클라이언트에게 message 이벤트를 전송합니다.');
            io.sockets.emit('message', message);
        } else {
            if(message.command == 'chat') {
                if(login_ids[message.recepient]) {
                    io.sockets.connected[login_ids[message.recepient]].emit('message', message);

                    sendResponse(socket, 'message', '200', '메세지를 전송했습니다. ');
                } else {
                    sendResponse(socket, 'login', '404', '상대방의 로그인 ID를 찾을 수 없습니다.');
                }
            } else if (message.command == 'groupchat') {
                io.sockets.in(message.recepient).emit('message', message);

                sendResponse(socket, 'message', '200', '방 [' + message.recepient + ']의 모든 사용자에게 메세지를 전송했습니다. ');
            }
        }
    });

    socket.on('login', (login) => {
        console.log('login 이벤트를 받았습니다.');
        console.dir(login);

        console.log('접속한 소켓의 ID : ' + socket.id);
        login_ids[login.id] = socket.id;
        socket.login_id = login.id;

        console.log('접속한 클라이언트 ID 개수 : %d', Object.keys(login_ids).length);

        sendResponse(socket, 'login', '200', '로그인 되었습니다.');
    });

    
    
    socket.on('room', (room) => {
        console.log('room 이벤트를 받았습니다.');
        console.dir(room);

        if(room.command == 'create') {
            if(io.sockets.adapter.rooms[room.roomId]) {
                console.log('방이 이미 만들어져 있습니다.');

            } else {
                console.log('방을 새로 만듭니다.');

                socket.join(room.roomId);

                var curRoom = io.sockets.adapter.rooms[room.roomId];
                console.log('curRoom', curRoom);
                curRoom.id = room.roomId;
                curRoom.name = room.roomName;
                curRoom.owner = room.roomOwner;
            }
        } else if (room.command == 'update') {
            
            if(io.sockets.adapter.rooms[room.roomId]) {
                var curRoom = io.sockets.adapter.rooms[room.roomId];
                curRoom.id = room.roomId;
                curRoom.name = room.roomName;
                curRoom.owner = room.roomOwner;
            } else {
                console.log('방이 만들어져 있지 않습니다.')
            }
        } else if (room.command == 'delete') {
            socket.leave(room.roomId);

            if(io.sockets.adapter.rooms[room.roomId]) {
                delete io.sockets.adapter.rooms[room.roomId];
            } else {
                console.log('방이 만들어져 있지 않습니다.');
            }
        } else if (room.command == 'join') {
            socket.join(room.roomId);

            //응답 메세지 전송
            sendResponse(socket, 'room', '200', '방에 입장하였습니다.');
        } else if (room.command == 'leave') {
            socket.leave(room.roomId);

            sendResponse(socket, 'room', '200', '방에서 나갔습니다');
        }

        var roomList = getRoomList();

        var output = { command: 'list', rooms: roomList };
        console.log('클라이언트로 보낼 데이터 : ' + JSON.stringify(output));

        io.sockets.emit('room', output);
    });

    getRoomList = () => {
        console.dir(io.sockets.adapter.rooms);

        var roomList = [];

        Object.keys(io.sockets.adapter.rooms).forEach((roomId) => {
            console.log('current room id : ' + roomId);
            var outRoom = io.sockets.adapter.rooms[roomId];

            var foundDefault = false;
            var index = 0;

            Object.keys(outRoom.sockets).forEach((key) => {
                console.log('#' + index + ' : ' + key + ', ' + outRoom.sockets[key]);

                if(roomId == key) {
                    foundDefault = true;
                    console.log('this is default room.');
                }

                index++;
            });

            if(!foundDefault) {
                roomList.push(outRoom);
            }
        });

        console.log('[ROOM LIST]');
        console.dir(roomList);

        return roomList;
    }

    sendResponse = (socket, command, code, message) => {
        var statusObj = { command: command, code: code, message: message };
        socket.emit('response', statusObj);
    }
});