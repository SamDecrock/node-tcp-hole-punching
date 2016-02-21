#!/usr/bin/env node
var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// based on http://www.bford.info/pub/net/p2pnat/index.html

var addressOfS = 'x.x.x.x'; // replace this with the IP of the server running publicserver.js
var portOfS = 9999;

var socketToS;
var tunnelEstablished = false;

function connectToS () {
	console.log('> (B->S) connecting to S');

	socketToS = require('net').createConnection({host : addressOfS, port : portOfS}, function () {
		console.log('> (B->S) connected to S via', socketToS.localAddress, socketToS.localPort);


		// letting local address and port know to S so it can be can be sent to client A:
	   	socketToS.write(JSON.stringify({
	   		name: 'B',
	   		localAddress: socketToS.localAddress,
	   		localPort: socketToS.localPort
	   	}));
	});

	socketToS.on('data', function (data) {
		console.log('> (B->S) response from S:', data.toString());

		var connectionDetails = JSON.parse(data.toString());
		if(connectionDetails.name == 'B') {
			// own connection details, only used to display the connection to the server in console:
			console.log("");
			console.log('> (B)', socketToS.localAddress + ':' + socketToS.localPort, '===> (NAT of B)', connectionDetails.remoteAddress + ':' + connectionDetails.remotePort, '===> (S)', socketToS.remoteAddress + ':' + socketToS.remotePort);
			console.log("");
		}


		if(connectionDetails.name == 'A') {
			console.log('> (B) time to listen on port used to connect to S ('+socketToS.localPort+')');
	    	listen(socketToS.localAddress, socketToS.localPort);

			// try connecting to A directly:
			connectTo(connectionDetails.remoteAddress, connectionDetails.remotePort);
		}
	});

	socketToS.on('end', function () {
	    console.log('> (B->S) connection closed.');
	});

	socketToS.on('error', function (err) {
	    console.log('> (B->S) connection closed with err:', err.code);
	});
}

connectToS();

function connectTo (ip, port) {
	if(tunnelEstablished) return;

	console.log('> (B->A) connecting to A: ===> (A)', ip + ":" + port);
	var c = require('net').createConnection({host : ip, port : port}, function () {
		console.log('> (B->A) Connected to A via', ip + ":" + port);
		tunnelEstablished = true;
	});

	c.on('data', function (data) {
	    console.log('> (B->A) data from A:', data.toString());
	});

	c.on('end', function () {
	    console.log('> (B->A) connection closed.');
	});

	c.on('error', function (err) {
	    console.log('> (B->A) connection closed with err:', err.code);
	    setTimeout(function () {
	    	connectTo(ip, port);
	    },500);
	});
}


var tunnelSocket = null;

function listen (ip, port) {
	var server = require('net').createServer(function (socket) {
		tunnelSocket = socket;

		console.log('> (B) someone connected, it\s:', socket.remoteAddress, socket.remotePort);

	    socket.write("Hello there NAT traversal man, you are connected to B!");
	    tunnelEstablished = true;

	    readStuffFromCommandLineAndSendToA();
	});

	server.listen(port, ip, function (err) {
		if(err) return console.log(err);
		console.log('> (B) listening on ', ip + ":" + port);
	});
}

function readStuffFromCommandLineAndSendToA () {
	if(!tunnelSocket) return;

	rl.question('Say something to A:', function (stuff) {
		tunnelSocket.write(stuff);

		readStuffFromCommandLineAndSendToA();
	});
}

