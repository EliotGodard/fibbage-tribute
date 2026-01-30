// Import the Express module
var express = require('express');

// Import the 'path' module (packaged with Node.js)
var path = require('path');

// Create a new instance of Express
var app = express();

// Import the Fibbage Tribute game file.
var fibbage = require('./agxgame');

// Serve static html, js, css, and image files from the 'public' directory
app.use(express.static(path.join(__dirname,'public')));

// Create a Node.js based http server on port 8080
var server = require('http').createServer(app).listen(process.env.PORT || 8080);

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io')(server);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.on('connection', function (socket) {
    //console.log('client connected');
    fibbage.initGame(io, socket);
});
