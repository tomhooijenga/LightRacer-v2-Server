var ws = require("nodejs-websocket");

var server = ws.createServer(onConnection);
server.listen(8001);

function onConnection(conn) {
    conn.sendText("Hello");

    conn.on("text", function (str) {
        console.log("Received " + str);
        conn.sendText(str.toUpperCase() + "!!!");
    });
    conn.on("close", function (code, reason) {
        console.log("Connection closed")
    });
}
