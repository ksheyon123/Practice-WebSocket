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
var WebSocket = require('./routes/websocket');

app.use(mainRouter);

var server = app.listen(3000, '192.168.0.40',  function() {
    console.log('Main Page Connected');
});

var io = socketio.listen(server);

// WebSocket(io);
//클라이언트가 연결했을 때의 이벤트 처리
io.sockets.on('connection', function(socket) {
	console.log('connection info :', socket.request.connection._peername);

	// 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
	socket.remoteAddress = socket.request.connection._peername.address;
    socket.remotePort = socket.request.connection._peername.port;
    
    socket.on('message', (message) => {
        console.log('message 이벤트를 받았습니다. ');
        console.dir(message);

        if (message.recepient == 'ALL') {
            console.dir('나를 포함한 모든 클라이언트에게 message 이벤트를 전송합니다.');
            io.sockets.emit('message', message);
        } else {
            console.log('message recepient', login_ids)
            if (login_ids[message.recepient]) {
                io.sockets.connected[login_ids[message.recepient]].emit('message', message);

                sendResponse(socket, 'message', '200', '메세지를 전송했습니다.');
            } else {
                sendResponse(socket, 'login', '404', '상대방의 로그인 ID를 찾을 수 없습니다.');
            }
        }
    });

    var login_ids= {};
    socket.on('login', (login) => {
        console.log('login 이벤트를 받았습니다.');
        console.dir(login);

        console.log('접속한 소켓의 ID : ', socket.id);
        // var data = makeObject(login.id, socket.id);
        // login_ids.push(data);
        login_ids[login.id] = socket.id;
        socket.login_id = login.id;
        console.log('접속한 클라이언트 ID 개수 :  %d', Object.keys(login_ids).length);

        sendResponse(socket, 'login', '200', '로그인되었습니다.');
    });

    function sendResponse(socket, command, code, message) {
        var statusObj = {command: command, code: code, message: message};
        socket.emit('response', statusObj);
    }

    function makeObject(attr, value) {
        var data = new Object();
        data[attr] = value;
        return data;
    }
});