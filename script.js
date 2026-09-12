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

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
	timeZone: 'Europe/Moscow',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit'
})

function startLyrics(element) {
	let state = { line: 0, text: '', deleting: false }

	function tick() {
		state = nextLyricState(state, lyrics)
		element.textContent = state.text
		const fullLine = state.deleting && state.text === lyrics[state.line]
		setTimeout(tick, fullLine ? 1800 : state.deleting ? 140 : 65)
	}

	tick()
}

if (typeof document !== 'undefined') {
	const lyric = document.querySelector('.lyric')
	const clock = document.querySelector('.clock')

	if (lyric) startLyrics(lyric)
	if (clock) {
		const updateClock = () => {
			clock.textContent = timeFormatter.format(new Date())
		}
		updateClock()
		setInterval(updateClock, 1000)
	}
}
