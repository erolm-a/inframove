#!/usr/bin/env node

var Leap = require('leapjs');
var glMatrix = require('gl-matrix')
	
//var SerialPort = require('serialport');
//var port = new SerialPort('/dev/ttyUSB0', {baudRate: 115200})
console.log("Inizializzato")

function truncate(num, step)
{
	return Math.trunc(num/step)*step;
}

function getOpenness(finger)
{
	var mcpDirection = finger.metacarpal.direction()
	var proximalDirection = finger.proximal.direction()
	var medialDirection = finger.medial.direction()
	var distalDirection = finger.distal.direction()
	console.log("Per il dito " + finger.type)
	console.log(proximalDirection)

	//var mcp2prox = 180 - (Math.abs(glMatrix.vec3.angle(mcpDirection, proximalDirection)) * 180 / Math.PI)
	//var prox2dist = 180 - (Math.abs(glMatrix.vec3.angle(medialDirection, distalDirection)) / 180 * Math.PI)

	//console.log(mcp2prox + ' ' + prox2dist)
	
	
}
Leap.loop(function(frame) {
	if(typeof(this.i) == 'undefined')
	this.i = 0
	else ++this.i;
	if((this.i % 4) != 0) return;

	var hands = frame.hands;
	var fingers = frame.fingers;

	console.log("Start frame")
	if(hands.length == 1) {
		var hand = hands[0]
		fingers.forEach(function(finger) {getOpenness(finger)})

		/*finger_shown[0] = 180;
		finger_shown[2] = finger_shown[3] = finger_shown[4] = finger_shown[5] = 90;
		*/

	//	console.log(finger_shown)
	/*	finger_shown.forEach(function(i) {
			port.write(String.fromCharCode(i), function(err) {
				if(err) console.log('error: ', err.message)
			})
		})
		port.write('\n')
		*/
	}

})
