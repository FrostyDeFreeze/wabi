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

	// stretch to exactly [-0.5, 0.5] so every layer spans its own band regardless of seed
	const min = Math.min(...pts)
	const max = Math.max(...pts)
	return pts.map(p => (p - min) / (max - min) - 0.5)
}

const ridges = [
	['#1f201e', 0.64, 0.14],
	['#161715', 0.72, 0.1],
	['#0e0f0e', 0.8, 0.08],
	['#070807', 0.9, 0.06]
]

function drawLandscape(canvas, seed) {
	const ctx = canvas.getContext('2d')
	const dpr = window.devicePixelRatio || 1
	const w = canvas.clientWidth
	const h = canvas.clientHeight
	canvas.width = w * dpr
	canvas.height = h * dpr
	ctx.scale(dpr, dpr)
	const rand = random(seed)
	// narrow screens show the middle of a wider ridge instead of squeezing it into spikes
	const span = Math.max(w, h * 1.4)
	const offset = (w - span) / 2

	// stars use their own stream so the mountains don't depend on the star count
	const starRand = random(seed + 1)
	ctx.fillStyle = '#d8dad6'
	const stars = Math.round((w * h) / 2500) // same density on any screen
	for (let i = 0; i < stars; i++) {
		const y = starRand() ** 1.6 * 0.6 // denser and brighter toward the top
		ctx.globalAlpha = (0.3 + starRand() * 0.7) * (1 - y / 0.6)
		ctx.beginPath()
		ctx.arc(starRand() * w, y * h, 0.3 + starRand() ** 3 * 1.1, 0, Math.PI * 2)
		ctx.fill()
	}
	ctx.globalAlpha = 1

	for (const [color, base, amp] of ridges) {
		const pts = ridge(rand, 9, 0.62)
		ctx.fillStyle = color
		ctx.beginPath()
		ctx.moveTo(0, h)
		pts.forEach((p, i) => ctx.lineTo(offset + (i / (pts.length - 1)) * span, h * base + p * h * amp * 2))
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

if (typeof document !== 'undefined') {
	const landscape = document.querySelector('.landscape')
	if (landscape) {
		const seed = (Math.random() * 2 ** 32) | 0
		drawLandscape(landscape, seed)
		addEventListener('resize', () => drawLandscape(landscape, seed))
	}

	const quote = document.querySelector('.quote')
	if (quote) {
		fetch('./quotes.json')
			.then(r => r.json())
			.then(quotes => {
				let last = null
				try {
					last = localStorage.getItem('quote')
				} catch {}
				// never show the same quote twice in a row
				let i
				do i = Math.floor(Math.random() * quotes.length)
				while (quotes.length > 1 && String(i) === last)
				quote.textContent = quotes[i]
				try {
					localStorage.setItem('quote', i)
				} catch {}
			})
			// no quote is better than an invisible page
			.catch(() => quote.remove())
	}
}
