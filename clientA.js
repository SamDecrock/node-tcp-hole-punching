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
	console.log('> (A->S) connecting to S');

	socketToS = require('net').createConnection({host : addressOfS, port : portOfS}, function () {
		console.log('> (A->S) connected to S via', socketToS.localAddress, socketToS.localPort);


		// letting local address and port know to S so it can be can be sent to client B:
	   	socketToS.write(JSON.stringify({
	   		name: 'A',
	   		localAddress: socketToS.localAddress,
	   		localPort: socketToS.localPort
	   	}));
	});

	socketToS.on('data', function (data) {
		console.log('> (A->S) response from S:', data.toString());

		var connectionDetails = JSON.parse(data.toString());
		if(connectionDetails.name == 'A') {
			// own connection details, only used to display the connection to the server in console:
			console.log("");
			console.log('> (A)', socketToS.localAddress + ':' + socketToS.localPort, '===> (NAT of A)', connectionDetails.remoteAddress + ':' + connectionDetails.remotePort, '===> (S)', socketToS.remoteAddress + ':' + socketToS.remotePort);
			console.log("");
		}


		if(connectionDetails.name == 'B') {
			console.log('> (A) time to listen on port used to connect to S ('+socketToS.localPort+')');
	    	listen(socketToS.localAddress, socketToS.localPort);

			// try connecting to B directly:
			connectTo(connectionDetails.remoteAddress, connectionDetails.remotePort);
		}
	});

	socketToS.on('end', function () {
	    console.log('> (A->S) connection closed.');
	});

	socketToS.on('error', function (err) {
	    console.log('> (A->S) connection closed with err:', err.code);
	});
}

connectToS();


function connectTo (ip, port) {
	if(tunnelEstablished) return;

	console.log('> (A->B) connecting to B: ===> (B)', ip + ":" + port);
	var c = require('net').createConnection({host : ip, port : port}, function () {
		console.log('> (A->B) Connected to B via', ip + ":" + port);
		tunnelEstablished = true;
	});

	c.on('data', function (data) {
	    console.log('> (A->B) data from B:', data.toString());
	});

	c.on('end', function () {
	    console.log('> (A->B) connection closed.');
	});

	c.on('error', function (err) {
	    console.log('> (A->B) connection closed with err:', err.code);
	    setTimeout(function () {
	    	connectTo(ip, port);
	    },500);
	});
}

var tunnelSocket = null;

function listen (ip, port) {
	var server = require('net').createServer(function (socket) {
		tunnelSocket = socket;

		console.log('> (A) someone connected, it\s:', socket.remoteAddress, socket.remotePort);

	    socket.write("Hello there NAT traversal man, you are connected to A!");
	    tunnelEstablished = true;

	    readStuffFromCommandLineAndSendToB();
	});

	server.listen(port, ip, function (err) {
		if(err) return console.log(err);
		console.log('> (A) listening on ', ip + ":" + port);
	});
}

function readStuffFromCommandLineAndSendToB () {
	if(!tunnelSocket) return;

	rl.question('Say something to B:', function (stuff) {
		tunnelSocket.write(stuff);

		readStuffFromCommandLineAndSendToB();
	});
}


