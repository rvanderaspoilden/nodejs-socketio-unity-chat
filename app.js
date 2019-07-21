var http = require("http");
var fs = require("fs");

var server = http.createServer(function (req, res) {
    res.end("Salut");
});

var io = require("socket.io").listen(server);

io.sockets.on('connection', function(socket) {
    console.log("new user connected");

    socket.on('disconnect', function(socket) {
        console.log("user disconnected");
    })
});

server.listen(8080);
