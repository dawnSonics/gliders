var energy = 0.05
var vehicleSize = 20

let padding = 300
let tilePadding = 10
let tileCount = 10
let tileHeight = 300
let notes = [
	{
		noteName: 'F',
		val: 53
	},
	{
		noteName: 'A',
		val: 57
	},
	{
		noteName: 'A#',
		val: 58
	},
	{
		noteName: 'D',
		val: 62
	}
]

var state = 0 // 0: no interaction, 1: vehicle birth
var vehicles = []
var tiles = []
var fetus = false

let midiOut = null

function setup() {
	createCanvas(windowWidth, windowHeight);

	WebMidi
		.enable()
		.then(onMidiEnabled)
		.catch(err => alert(err));

	for (let i = 0; i < tileCount; i++) {
		tiles.push(new Tile(padding + ((width - 2 * padding) / tileCount * i), (height - tileHeight) / 2, ((width - 2 * padding) / tileCount - tilePadding), tileHeight, notes[i % notes.length], 1))
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
	for (let tile of tiles) {
		tile.tick()
	}

	for (let tile of tiles) {
		for (let vehicle of vehicles) {
			let collision = collideRectCircle(tile.pos.x, tile.pos.y, tile.width, tile.height, vehicle.x, vehicle.y, vehicleSize)
			// this.hit = this.hit || collision
			if (collision) {
				tile.onHit()
			}
		}
	}
	// 	// if ((this.pos.y <= other.pos.y + 10) && (this.pos.x <= other.pos.x) && (this.pos.x + this.width >= other.pos.x)) {
	// 	// 	this.hit = true
	// 	// } else {
	// 	// 	this.hit = false
		// }

	// 	if (this.hit) {
	// 		// console.log(this.note)
	// 		this.onHit(exciters[exciters.length - 1])
	// 	} else {
	// 		this.offHit()
	// 	}

	// draw
	for (let tile of tiles) {
		tile.draw()
	}
	for (let vehicle of vehicles) {
		vehicle.draw()
	}
	if (fetus) {
		fetus.draw()

		// TO DO: draw speed arrow
		noFill()
		stroke(255, 255);
		strokeWeight(1)
		line(fetus.x, fetus.y, mouseX, mouseY)
	}
}

// =============================================

function mousePressed() {
	state = 1
	fetus = new Vehicle(mouseX, mouseY)
}

function mouseClicked() {
	state = 0

	vx = (fetus.x - mouseX) * energy
	vy = (fetus.y - mouseY) * energy
	if (!(vx == 0 && vy == 0)) {
		fetus.setVelocity(vx, vy)
	}
	vehicles.push(fetus)
	fetus = false
}

function handleInteractions() {
	if (state == 1) {
		let vx = fetus.x - mouseX
		let vy = fetus.y - mouseY
		if (!(vx == 0 && vy == 0)) {
			fetus.setAngle(xyToAngle(vx, vy))
		}
	}
}

// =============================================

class Vehicle {
	constructor(x, y) {
		this.x = x
		this.y = y

		this.setVelocity(random(-2, 2), random(-2, 2))
		this.setVertices()
	}

	draw() {
		stroke(255, 255);
		strokeWeight(2)
		fill(0)
		// ellipse(this.x, this.y, 60, 60)

		triangle(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3)
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
		this.x1 = this.x + (vehicleSize + speed) * cos(this.angle)
		this.y1 = this.y + (vehicleSize + speed) * sin(this.angle)
		this.x2 = this.x + (vehicleSize - speed/2) * cos(this.angle + 2 * PI/3)
		this.y2 = this.y + (vehicleSize - speed/2) * sin(this.angle + 2 * PI/3)
		this.x3 = this.x + (vehicleSize - speed/2) * cos(this.angle + 4 * PI/3)
		this.y3 = this.y + (vehicleSize - speed/2) * sin(this.angle + 4 * PI/3)
	}

	tick() {
		this.x = (this.x + this.vx) // % windowWidth
		this.y = (this.y + this.vy) // % windowHeight
		this.setVertices()
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
		this.hit = false
		this.channel = channel

		this.playing = false
	}

	onHit(other) {
		// let velocity = (other.lifetime / excLifetime) ** 3 // velocity is between 0 and 1

		let velocity = 1
		this.fillVal = 255 * min(1, sqrt(velocity * 5))

		// if (Math.abs(other.vel.y) > 2) {
		// 	// this.env.setADSR(random(0, 0.2), 0.0, 0.1, 0.5) // RANDOM ATTACK

		// 	if (midiOut) {
		// 		// midiOut.channels[1].playNote(this.note.val, {duration: 100, attack: velocity});
		// 		if (!this.prevHit)
		// 			console.log(midiOut.channels)
		// 		console.log(this.channel)
		// 		midiOut.channels[this.channel].sendNoteOn(this.note.val, { attack: velocity });
		// 		this.prevHit = true
		// 	}
	}

	// offHit() {
	// 	if (midiOut && this.prevHit)
	// 		midiOut.channels[this.channel].sendNoteOff(this.note.val);
	// 	this.prevHit = false
	// }

	// intersects(exciters) {
		// this.hit = false
	// 	for (let exciter of exciters) {
	// 		let collision = collideRectCircle(this.pos.x, this.pos.y, this.width, this.height, exciter.pos.x, exciter.pos.y, 10)
	// 		this.hit = this.hit || collision
	// 	}
	// 	// if ((this.pos.y <= other.pos.y + 10) && (this.pos.x <= other.pos.x) && (this.pos.x + this.width >= other.pos.x)) {
	// 	// 	this.hit = true
	// 	// } else {
	// 	// 	this.hit = false
		// }

	// 	if (this.hit) {
	// 		// console.log(this.note)
	// 		this.onHit(exciters[exciters.length - 1])
	// 	} else {
	// 		this.offHit()
	// 	}
	// }

	draw() {
		stroke(255, 255);
		strokeWeight(1)
		fill(255, this.fillVal)
		rect(this.pos.x, this.pos.y, this.width, this.height)
	}

	tick() {
		this.fillVal *= 0.8
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

// =============================================

function onMidiEnabled() {
	console.log("WebMidi enabled!")

	// Inputs
	console.log("Inputs:")
	WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));

	// Outputs
	console.log("Outputs:")
	WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));

	midiOut = WebMidi.getOutputByName("loopMIDI Port");
}
