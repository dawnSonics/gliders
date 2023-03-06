var energy = 0.05
var vehicleSize = 20
var vehicleLifetime = 400
// var midiOutPortName = "loopMIDI Port 1"
var midiOutPortName = "IAC Driver Bus 1"

let padding = 300
let tilePadding = 10
let tileCount = 10
let tileHeight = 1800

// g-thang
let notes = [{noteName: '', val: 35, weight: 0.19796954314720813, lifetime: 197.96954314720813}, {noteName: '', val: 33, weight: 0.06598984771573604, lifetime: 65.98984771573605}, {noteName: '', val: 30, weight: 0.06598984771573604, lifetime: 65.98984771573605}, {noteName: '', val: 38, weight: 0.06598984771573604, lifetime: 65.98984771573605}, {noteName: '', val: 40, weight: 0.06598984771573604, lifetime: 65.98984771573605}, {noteName: '', val: 42, weight: 0.06598984771573604, lifetime: 65.98984771573605}, {noteName: '', val: 95, weight: 0.03807106598984772, lifetime: 38.07106598984772}, {noteName: '', val: 93, weight: 0.02622673434856176, lifetime: 26.22673434856176}, {noteName: '', val: 97, weight: 0.012690355329949238, lifetime: 12.690355329949238}, {noteName: '', val: 91, weight: 0.012690355329949238, lifetime: 12.690355329949238}, {noteName: '', val: 90, weight: 0.027918781725888325, lifetime: 27.918781725888326}, {noteName: '', val: 88, weight: 0.015228426395939087, lifetime: 15.228426395939087}, {noteName: '', val: 71, weight: 0.08037225042301184, lifetime: 80.37225042301183}, {noteName: '', val: 69, weight: 0.07952622673434856, lifetime: 79.52622673434855}, {noteName: '', val: 66, weight: 0.11928934010152284, lifetime: 119.28934010152284}, {noteName: '', val: 83, weight: 0.00338409475465313, lifetime: 3.3840947546531304}, {noteName: '', val: 81, weight: 0.00338409475465313, lifetime: 3.3840947546531304}, {noteName: '', val: 78, weight: 0.00676818950930626, lifetime: 6.768189509306261}, {noteName: '', val: 76, weight: 0.00338409475465313, lifetime: 3.3840947546531304}, {noteName: '', val: 86, weight: 0.0025380710659898475, lifetime: 2.5380710659898473}, {noteName: '', val: 85, weight: 0.0008460236886632825, lifetime: 0.8460236886632826}, {noteName: '', val: 64, weight: 0.03976311336717428, lifetime: 39.76311336717428}]

var state = 0 // 0: no interaction, 1: vehicle birth
var vehicles = []
var tiles = []
var fetus = false
var clickX = 0 , clickY = 0

let midiOut = null
let dudler;

function preload() {
	dudler = loadFont('assets/Dudler-Regular.woff');
}

function setup() {
	createCanvas(windowWidth, windowHeight);

	WebMidi
		.enable()
		.then(onMidiEnabled)
		.catch(err => alert(err));

	for (let i = 0; i < tileCount; i++) {
		let noteIdx = i % notes.length
		tiles.push(
			new Tile(
				padding + ((width - 2 * padding) / tileCount * (2*i + 1)/2),
				height / 2,
				((width - 2 * padding) / tileCount - tilePadding),
				tileHeight * notes[noteIdx].weight,
				notes[noteIdx], 1))
	}

}

function draw() {
	background(0)
	
	// handle interactions
	handleInteractions()

	// run the model
	for (let vehicle of vehicles) {
		vehicle.tick()
	}
	for (let i = vehicles.length-1; i >=0; i--) {
		if (vehicles[i].finished()) {
			vehicles.splice(i, 1)
		}
	}
	for (let tile of tiles) {
		tile.tick()
		if (tile.finished()) {
			tile.setNote(notes[Math.floor(random(0, notes.length))])
		}

		let hit = false
		let velocity = 0
		for (let vehicle of vehicles) {
			let collision = collideRectCircle(tile.pos.x - tile.width/2, tile.pos.y - tile.height/2, tile.width, tile.height, vehicle.x, vehicle.y, vehicleSize)
			if (collision) {
				velocity = max(velocity, (vehicle.lifetime/vehicleLifetime)**3)
				hit = true
			}
		}
		if (hit) {
			tile.onHit(velocity) 
		} else {
			tile.offHit()
		}
	}

	// draw
	for (let tile of tiles) {
		tile.draw()
	}
	for (let vehicle of vehicles) {
		vehicle.draw()
	}
	if (fetus) {
		noFill()
		stroke(255, 255);
		strokeWeight(2)
		line(fetus.x, fetus.y, mouseX, mouseY)

		fetus.draw()
	}
}

// =============================================

function mousePressed() {
	clickX = mouseX
	clickY = mouseY
	if (state == 0) {
		state = 1
		fetus = new Vehicle(mouseX, mouseY)
	}
}

function mouseClicked() {
	state = 0
	if (!(fetus.vx == 0 && fetus.vx == 0))
	vehicles.push(fetus)
	fetus = false
}

function handleInteractions() {
	if (state == 1) {
		// let vx = (fetus.x - mouseX) * energy
		// let vy = (fetus.y - mouseY) * energy
		let vx = (clickX - mouseX) * energy
		let vy = (clickY - mouseY) * energy
		let speed = sqrt(vx**2 + vy**2)
		if (!(vx == 0 && vy == 0)) {
			fetus.x = (mouseX + clickX) / 2
			fetus.y = (mouseY + clickY) / 2
			fetus.setVelocity(vx, vy)
			fetus.setScale(min(1, speed))
		}
	}
}

// =============================================

class Vehicle {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.lifetime = vehicleLifetime
		this.scale = 0.1

		this.setVelocity(0, 0)
		this.setAngle(xyToAngle(windowWidth/2 - x, windowHeight/2 - y))
	}

	draw() {
		strokeJoin(ROUND);
		stroke(255, this.lifetime);
		strokeWeight(2)
		fill(0, this.lifetime)

		triangle(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3)

		// stroke(255, 255);
		// strokeWeight(2)
		// line(this.x, this.y, windowWidth/2, windowHeight/2)
	}

	tick() {
		this.x = modulo(this.x + this.vx, windowWidth)
		this.y = modulo(this.y + this.vy, windowHeight)
		this.lifetime -= 2
		this.setVertices()

		// let vx = this.vx + random(-1, 1)
		// let vy = this.vy + random(-1, 1)
		// this.setVelocity(vx, vy)
	}

	finished() {
		return this.lifetime <= 0
	}

	setScale(scale) {
		this.scale = scale
	}

	setVelocity(vx, vy) {
		this.vx = vx
		this.vy = vy

		this.angle = xyToAngle(vx, vy)
		this.setVertices()
	}

	setAngle(angle) {
		this.angle = angle
		this.setVertices()
		// TO DO: set vx, vy
	}

	setVertices() {
		let speed = sqrt(this.vx**2 + this.vy**2)
		this.x1 = this.x + (vehicleSize * this.scale + speed) * cos(this.angle)
		this.y1 = this.y + (vehicleSize * this.scale + speed) * sin(this.angle)
		this.x2 = this.x + max(vehicleSize * this.scale - speed/2, 1) * cos(this.angle + 2 * PI/3)
		this.y2 = this.y + max(vehicleSize * this.scale - speed/2, 1) * sin(this.angle + 2 * PI/3)
		this.x3 = this.x + max(vehicleSize * this.scale - speed/2, 1) * cos(this.angle + 4 * PI/3)
		this.y3 = this.y + max(vehicleSize * this.scale - speed/2, 1) * sin(this.angle + 4 * PI/3)
	}
}

class Tile {
	constructor(x, y, w, h, note, channel) {
		this.pos = createVector(x, y)
		this.width = w
		this.height = h
		this.fillVal = 200
		this.note = note
		this.prevHit = false
		this.channel = channel

		this.playing = false
		this.lifetime = this.note.lifetime
	}

	draw() {
		if (this.note.weight > 0) {
			stroke(255, 255);
			strokeWeight(1)
			fill(255, this.fillVal)
			rect(this.pos.x - this.width/2, this.pos.y - this.height/2, this.width, this.height)

			fill(255 - this.fillVal)
			noStroke()
			textSize(15)
			textFont((dudler))
			text(noteValToName(this.note.val), this.pos.x - 5, this.pos.y + 7)
		}
	}

	tick() {
		this.fillVal *= 0.8
		this.lifetime -= 1

		this.height += (tileHeight * this.note.weight - this.height) * 0.15
	}

	finished() {
		return this.lifetime <= 0
	}

	onHit(velocity=1) {
		// velocity is between 0 and 1
		this.fillVal = 255 * min(1, sqrt(velocity * 5))
		if (midiOut) {
			if (!this.prevHit) {
				midiOut.channels[this.channel].sendNoteOn(this.note.val, { attack: velocity });
				this.prevHit = true
			}
		}
	}

	offHit() {
		if (midiOut && this.prevHit)
			midiOut.channels[this.channel].sendNoteOff(this.note.val);
		this.prevHit = false
	}

	setNote(note) {
		this.offHit()
		this.note = note
		this.lifetime = note.lifetime
	}
}

function xyToAngle(x, y) {
	if (x != 0) {
		let angle = atan(y/x)
		if (x < 0) {
			angle += PI
		}
		return angle
	}
	return 0
}

function modulo(a, b) {
  return ((a % b) + b) % b;
}

noteNames = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
function noteValToName(val) {
	return noteNames[val % 12]
}

// =============================================

function onMidiEnabled() {
	console.log("WebMidi enabled!")

	// Inputs
	console.log("Inputs:")
	WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));

	// Outputs
	console.log("Outputs:")
	WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));

	midiOut = WebMidi.getOutputByName(midiOutPortName);
}