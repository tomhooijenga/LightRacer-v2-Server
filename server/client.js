var util = require('util');
var EventEmitter = require('events').EventEmitter;
var settings = require('../settings.json');
var action = settings.action;

util.inherits(Client, EventEmitter);

function Client(socket, id) {
    this.id = id;
    this.socket = socket;

    socket.on(action.move, function (data) {
        console.log(data)
    });

    var self = this;
    socket.on('disconnect', function () {
        self.emit('disconnect');
    });
}

Client.prototype.spawnPlayer = function () {
    var x, y, direction;

    // Create the spawn position with a 200px distance of the map edge
    // TODO: keep a certain distance on other players
    x = Math.floor(200 + Math.random() * (settings.game.size.x - 400));
    y = Math.floor(200 + Math.random() * (settings.game.size.y - 400));

    direction = settings.game.directions[Math.floor(Math.random() * 4)];

    // Emit the spawn action to the client.
    this.socket.emit(action.spawn, {
        x: x,
        y: y,
        id: this.id,
        dir: direction
    });
};

module.exports = Client;