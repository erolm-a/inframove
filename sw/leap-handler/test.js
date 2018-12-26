#!/usr/bin/env node
// Copyright by Emanuele Ferrara

/* Importazione delle librerie necessarie
 *
 * leapjs: 		 effettua il parsing automatico dei dati JSON forniti dal
 *             Websocket disponibile dal driver del Leap Motion
 * serialport: comunicazione seriale
 */

var Leap = require('leapjs');
var SerialPort = require('serialport');

// porta che sarà usata dalla seriale per Arduino
var port

// il nostro Arduino ha vendor "0x1a86"
// selezioniamolo e impostiamo il baudrate a 115200
SerialPort.list(function(err, ports) {
	console.log(ports)
	ports.forEach(function(i) {
		if(parseInt(i.vendorId, 16) == 0x1a86)
		port = new SerialPort(i.comName, {baudRate: 115200})
	})
})
console.log("Inizializzato")

/* roba di algebra lineare
 *
 * Il Leap Motion effettua il tracking della mano e restituisce
 * all'user una serie di dati in forma vettoriale. Questi possono essere di tipo
 * coordinate assolute o di tipo "vettore rispetto alla base del palmo", ovvero
 * con coordinate definite sulla base ortonormale del palmo della mano.
 * La base vettoriale del palmo della mano è costituita da tre vettori:
 *    - il vettore X, parallelo alle protuberanze carpali, "orizzontale"
 *    - il vettore Y, perpendicolare al piano individuato da 3 punti del palmo,
 *				"verticale"
 *		- il vettore Z, longitudinale dal polso fino al dito medio
 *
 * Il movimento delle dita è determinato dalla loro "chiusura", ovvero quanto
 * sia "elevata" la proiezione sull'asse Y del palmo di un singolo dito.
 * In realtà, un dito è caratterizzato da più ossa (metacarpal, proximal, medial,
 * distal), e si è preferito usare il proximal (i.e. falange).
 * Per ottenere la sola componente verticale del vettore di proximal è stato
 * usato il metodo di ortogonalizzazione Graam-Schmidt in modo tale da togliere
 * la componente orizzontale, e a quel punto è bastato un banale prodotto
 * scalare opportunamente calibrato per ottenere il grado di apertura e chiusura
 *
*/

function difference(v1, v2) {
	return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]];
}

function mul(v, scalar)
{
	for(var i = 0; i < v.length; i++)
		v[i]*=scalar;
	return v;
}


function scalarproduct(v1, v2) {
	return (v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]);
}

function graamschmidt(palm, fingervector)
{
	var scalar = scalarproduct(palm, fingervector)
	var prodotto = mul(palm, scalar)
	var diff = difference(fingervector, prodotto)
	return diff;

}

// Elimina del jitter tra i servomotori impedendo loro di muoversi
// a scatti di meno di `step` gradi
function truncate(num, step)
{
	return Math.trunc(num/step)*step;
}

// Loop principale invocato dal framework di Leap.js
Leap.loop(function(frame) {
	// Il leap ha una velocità di tracking di 40 fps, eccessivi per l'Arduino.
	// Invia solo un frame ogni 4, ovvero 10 fps
	if(typeof(this.i) == 'undefined')
	this.i = 0
	else ++this.i;
	if((this.i % 4) != 0) return;

	var hands = frame.hands;
	var fingers = frame.fingers;

  // il numero di gradi per cui i servomotori ruoteranno saranno pushati qui
	// ordine: polso, pollice, indice, medio, anulare, mignolo
	var finger_shown = []

	console.log("Start frame")
	// prevenire è meglio che curare: non fare nulla con due mani
	if(hands.length == 1) {
		var hand = hands[0]
		// la componente x del polso è usata per gestire la sua rotazione
		var wristXProj = hand.palmNormal[0]
		var wristScaled = 180*(wristXProj < 0 ? 1 + wristXProj : 1)
		finger_shown.push(truncate(wristScaled, 5))
		fingers.forEach(function(finger) {
			var res = scalarproduct(hands[0].palmNormal, graamschmidt(hands[0].direction, finger.proximal.direction()))
			// Tronca a scatti di 30° gli angoli
			var scaled = truncate(res*180.0/0.75, 30)+40;
			if(scaled < 0) scaled = 0;
			else if(scaled > 180) scaled = 180;
			finger_shown.push(180 - scaled)
		})

		// newline in ASCII, per l'output in seriale
		finger_shown.push(0x0A)
		console.log(finger_shown)
		buf = Buffer.from(finger_shown)
		// scrive alla seriale il buffer più il newline
		port.write(buf)

	}

})
