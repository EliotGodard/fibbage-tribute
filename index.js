// Import the Express module
const express = require('express');

// Import the 'path' module (packaged with Node.js)
const path = require('path');

// Create a new instance of Express
const app = express();

// Import the Anagrammatix game file.
const agx = require('./agxgame');

// Create a simple Express application
app.configure(() => {
  // Turn down the logging activity
  app.use(express.logger('dev'));

  // Serve static html, js, css, and image files from the 'public' directory
  app.use(express.static(path.join(__dirname, 'public')));
});

// Create a Node.js based http server on port 8080
const server = require('http').createServer(app).listen(process.env.PORT || 8080);

// Create a Socket.IO server and attach it to the http server
const io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
io.set('log level', 1);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', (socket) => {
  //console.log('client connected');
  agx.initGame(io, socket);
});
