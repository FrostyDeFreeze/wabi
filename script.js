export const lyrics = [
	'the face behind the silhouette',
	'in this world i made to be infinite',
	'but within the expanse, i finally see',
	"a world without you isn't meant for me",
	'picking up pieces left from another life',
	'this fleeting memory is everything you left behind',
	"i'm just a whisper, just a specter locked away in time",
	'this purgatory is eating away at my mind',
	'this is my epilogue, my soliloquy',
	'take this broken melody straight to the grave',
	'dancing like flames',
	"after all that i've done",
	"i'll salt the earth and disappear",
	'in a sea of fire'
]

export function nextLyricState(state, lines) {
	if (!state.deleting) {
		const text = lines[state.line].slice(0, state.text.length + 1)
		return { line: state.line, text, deleting: text === lines[state.line] }
	}
	if (state.text) {
		const words = state.text.split(' ')
		words.pop()
		return { line: state.line, text: words.join(' '), deleting: true }
	}

	return { line: (state.line + 1) % lines.length, text: '', deleting: false }
}

const waves = [
	[0.1, 0.025, 0.12],
	[0.19, 0.008, -0.1],
	[0.21, 0.009, 1],
	[0.23, 0.009, -0.22],
	[0.45, 0.045, 0.28]
]

export function beatShape(t) {
	return waves.reduce((y, [c, w, a]) => y + a * Math.exp(-(((t - c) / w) ** 2) / 2), 0)
}

export function nextInterval(time) {
	return (60 / 62) * (1 - 0.05 * Math.sin((2 * Math.PI * time) / 4.5)) * (1 + (Math.random() - 0.5) * 0.04)
}

function random(seed) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

export function ridge(rand, depth, rough) {
	let pts = [rand() - 0.5, rand() - 0.5]
	let amp = 1
	for (let d = 0; d < depth; d++) {
		const next = []
		for (let i = 0; i < pts.length - 1; i++) next.push(pts[i], (pts[i] + pts[i + 1]) / 2 + (rand() - 0.5) * amp)
		next.push(pts[pts.length - 1])
		pts = next
		amp *= rough
	}

	return pts
}

const ridges = [
	['#191a18', 0.64, 0.14],
	['#121311', 0.72, 0.1],
	['#0c0d0c', 0.8, 0.08],
	['#070807', 0.9, 0.06]
]

function drawLandscape(canvas) {
	const ctx = canvas.getContext('2d')
	const dpr = window.devicePixelRatio || 1
	const w = canvas.clientWidth
	const h = canvas.clientHeight
	canvas.width = w * dpr
	canvas.height = h * dpr
	ctx.scale(dpr, dpr)
	const rand = random(7)
	const flatten = Math.min(1, (w / h) * 1.4)

	for (const [color, base, ridgeAmp] of ridges) {
		const amp = ridgeAmp * flatten
		const pts = ridge(rand, 9, 0.62)
		ctx.fillStyle = color
		ctx.beginPath()
		ctx.moveTo(0, h)
		pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * w, h * base + p * h * amp * 2))
		ctx.lineTo(w, h)
		ctx.fill()
		const top = h * (base - amp)
		const bottom = h * (base + amp + 0.06)
		const fog = ctx.createLinearGradient(0, top, 0, bottom)
		fog.addColorStop(0, 'rgb(60 62 58 / 0)')
		fog.addColorStop(0.7, 'rgb(60 62 58 / 0.2)')
		fog.addColorStop(1, 'rgb(60 62 58 / 0)')
		ctx.fillStyle = fog
		ctx.fillRect(0, top, w, bottom - top)
	}
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
	timeZone: 'Europe/Moscow',
	hour: '2-digit',
	minute: '2-digit'
})

function startLyrics(element) {
	let state = { line: 0, text: '', deleting: false }

	function tick() {
		state = nextLyricState(state, lyrics)
		element.textContent = state.text
		const fullLine = state.deleting && state.text === lyrics[state.line]
		setTimeout(tick, fullLine ? 1800 : state.deleting ? 140 : 60)
	}

	tick()
}

function startPulse(canvas) {
	const ctx = canvas.getContext('2d')
	const ink = getComputedStyle(canvas).color
	const signal = getComputedStyle(canvas).getPropertyValue('--signal')
	const speed = 64
	const fade = 3.5
	const step = 0.002
	let width, height
	let points = []
	let time = 0
	let beat = 0
	let next = 0
	let last = null

	function resize() {
		const dpr = window.devicePixelRatio || 1
		width = canvas.clientWidth
		height = canvas.clientHeight
		canvas.width = width * dpr
		canvas.height = height * dpr
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
	}

	function draw() {
		const base = height * 0.7
		const amp = height * 0.6
		ctx.clearRect(0, 0, width, height)
		ctx.lineWidth = 1
		ctx.lineJoin = 'round'
		ctx.globalAlpha = 0.12
		ctx.strokeStyle = ink
		ctx.beginPath()
		ctx.moveTo(0, base)
		ctx.lineTo(width, base)
		ctx.stroke()

		for (let i = 1; i < points.length; i += 8) {
			const chunk = points.slice(i - 1, i + 8)
			ctx.globalAlpha = 0.9 * Math.min(1, Math.max(0, 1 - (time - chunk[0].t) / fade))
			ctx.strokeStyle = chunk.some(p => p.a > 0.5) ? signal : ink
			ctx.beginPath()
			let prevX = Infinity
			for (const p of chunk) {
				const x = (p.t * speed) % width
				const y = base - p.a * amp
				if (x < prevX) ctx.moveTo(x, y)
				else ctx.lineTo(x, y)
				prevX = x
			}
			ctx.stroke()
		}
	}

	function frame(now) {
		const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1)
		last = now
		for (const end = time + dt; time < end; time += step) {
			if (time >= next) {
				beat = next
				next += nextInterval(next)
			}
			points.push({ t: time, a: beatShape(time - beat) })
		}
		while (points.length && points[0].t < time - fade) points.shift()
		draw()
		requestAnimationFrame(frame)
	}

	resize()
	addEventListener('resize', resize)
	requestAnimationFrame(frame)
}

if (typeof document !== 'undefined') {
	const lyric = document.querySelector('.lyric')
	const clock = document.querySelector('.clock')
	const pulse = document.querySelector('.pulse')
	const landscape = document.querySelector('.landscape')

	if (landscape) {
		drawLandscape(landscape)
		addEventListener('resize', () => drawLandscape(landscape))
	}
	if (lyric) startLyrics(lyric)
	if (pulse) startPulse(pulse)
	if (clock) {
		const updateClock = () => {
			clock.textContent = timeFormatter.format(new Date())
		}
		updateClock()
		setInterval(updateClock, 1000)
	}
}
