/**
 *
 * @param {number} id - The player's id
 * @param socket - The websocket connection
 * @constructor
 */
var Player = function (id, socket) {
    /**
     * @type {number} id - the player's id
     */
    this.id = id;

    /**
     * @type {number} lobbyId - the lobby the player is in
     */
    this.lobbyId = null;

    /**
     * The websocket connection
     */
    this.socket = socket;

    /**
     * @type {{}} spawn - An object with spawn information
     */
    this.spawn = null;
};

module.exports = Player;