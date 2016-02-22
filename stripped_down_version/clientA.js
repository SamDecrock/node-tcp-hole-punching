// clientA.js
var c = require('net').createConnection({host : 'PUBLIC_IP_OF_SERVER', port : 9999}, function () {
  console.log('> connected to public server via local endpoint:', c.localAddress + ':' + c.localPort);

  // do not end the connection, keep it open to the public server
  // and start a tcp server listening on the ip/port used to connected to server.js

  var server = require('net').createServer(function (socket) {
    console.log('> (clientA) someone connected, it\s:', socket.remoteAddress, socket.remotePort);
    socket.write("Hello there NAT traversal man, this is a message from a client behind a NAT!");
  }).listen(c.localPort, c.localAddress, function (err) {
    if(err) return console.log(err);
    console.log('> (clientA) listening on:', c.localAddress + ':' + c.localPort);
  });
});