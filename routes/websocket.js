var express = require('express');
var websocket = require('socket.io');
module.exports = (io) => {
    io.sockets.on('connection', (socket) => {
        console.log('connection info : ', socket.request.connection._peername);
        socket.remoteAddress = socket.request.connection._peername.address;
        socket.remotePort = socket.request.connection.__peername.port;
    });
};