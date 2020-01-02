const WebSocket = require('ws');

module.exports = (server) => {
    const wss = new WebSocket.Server({server});
    console.log(wss)
    wss.on('connection', (ws, req) => {
        console.log('hi')
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log('새로운 클라이언트 접속', ip);

        ws.on('message', (message) => {
            console.log('WebSocket Message', message);
        });

        ws.on('error', (err) => {
            console.log('WebSocket Err', error);
        });

        ws.on('close', () => {
            console.log('클라이언트 접속 해제');
            clearInterval(ws.interval);
        });

        const interval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
                ws.send('서버에서 클라이언트로 메세지를 보냅니다.');
            }
        }, 3000);
        ws.interval = interval;
    });
};