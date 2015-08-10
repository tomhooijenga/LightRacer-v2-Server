
var Player = function (id, socket) {
    this.id = id;

    this.lobbyId = null;

    this.socket = socket;

    this.spawn = null;
};

module.exports = Player;