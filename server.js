const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const circles = require("./circles-server");
const PORT = 8080;

app.use(express.static(__dirname + "/dist"));
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/dist"+"/pages/index.html");
});

var players = [];
io.on("connection", function(socket) {
    var data = {
      id: socket.id,
      color: circles.rgb()
    };
    players.unshift(data);
    socket.emit("init", JSON.stringify(players)); // Send data about other players to self
    socket.broadcast.emit("enter", JSON.stringify(data)); // Send data to others about self
    console.log("+",socket.id,"joined");
    socket.on("disconnect", function() {
        socket.broadcast.emit("exit", socket.id);
        console.log("-",socket.id,"left");
        for (var i = 0, player, max = players.length; i < max; i ++) {
          player = players[i];
          if (player.id === socket.id) {
            players.splice(i, 1);
            break;
          }
        }
    });
});

server.listen(8080, function() {
    console.log("Listening at port",PORT);
});
