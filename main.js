/* initial values */
const container = document.querySelector("#container");
const ship = document.querySelector("#ship");
const bullets = Array.from(document.querySelectorAll('.bullet'))
const exBullet = bullets[0]
const monstersContainer = document.querySelector('#monsters-container')
const exMonster = document.querySelector(".monster");

const containerWidth = container.clientWidth;
const shipWidth = ship.clientWidth;
const exBulletWidth = exBullet.clientWidth;
const exMonsterWidth = exMonster.clientWidth;

const containerHeight = container.clientHeight;
const shipHeight = ship.clientHeight;
const exBulletHeight = exBullet.clientHeight;
const exMonsterHeight = exMonster.clientHeight;

// initial distance from idleBullet's end to container end
const containerLeft = container.offsetLeft
const containerTop = container.offsetTop
const exBulletEndY = exBullet.getBoundingClientRect().bottom - containerTop

const music = document.querySelector("#music");
const scoreDiv = document.querySelector("#scoreboard__score");
const heart = document.querySelector("#player-health__heart");
const playerLives = document.querySelector("#player-health__lives");
// time taken to fire each bullet
const firetime = 300; //ms
// Define the debounced function
const debouncedShoot = debounce(shoot, firetime, true);

//music.play()
//music.sound = 0.7;
//music.loop = true;

let fingerOnShip,
shipOffsetX,
monsterSpeed = 7, // px per ms
moveMonsterDownId;
let spawnTime = 4000;

function playAudio(audio) {
	audio.currentTime = 0;
	audio.play();
}

function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this,
		args = arguments;
		var callNow = immediate && !timeout;
		clearTimeout(timeout)
		timeout = setTimeout(function () {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		},
			wait);
		if (callNow) func.apply(context, args);
	}
}

function setAnimDur(elem, durForPixel) {
	const elemStartBottom = containerHeight - (elem.getBoundingClientRect().top - containerTop)
	const duration = elemStartBottom * durForPixel
	elem.style.animationDuration = duration + 'ms'
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function requestFullScreen(element) {
	// Supports most browsers and their versions.
	var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

	if (requestMethod) {
		// Native full screen.
		requestMethod.call(element);
	} else if (typeof window.ActiveXObject !== "undefined") {
		// Older IE.
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript !== null) {
			wscript.SendKeys("{F11}");
		}
	}
}
var elem = document.body; // Make the body go full screen.
requestFullScreen(elem);

(function startGame() {
	// handleStars();
	const heartLossedSound = document.querySelector('#heart-lost-sound')
	heartLossedSound.addEventListener('loadedmetadata', () => heart.style.animationDuration = heartLossedSound.duration + 's')

	moveMonsterDownId = setInterval(moveMonsterDown, spawnTime)
	setAnimDur(exMonster, monsterSpeed)
	document.querySelector('#keyframes').innerHTML =
	`@keyframes moveDown {
	to {
	transform: translateY(${containerHeight}px)
	}
	}`
})()

function moveShip(e) {
	//console.log(e.targetTouches[0])
	const activeBullets =
	Array.from(document.querySelectorAll('.bullet'))
	.filter(bullet => bullet.dataset.transitioning)

	const nextShipX = e.targetTouches[0].clientX - shipOffsetX - containerLeft

	if (nextShipX <= 0 || nextShipX >= containerWidth - shipWidth) return;

	activeBullets.forEach(activeBullet =>
		activeBullet.style.left = (activeBullet.getBoundingClientRect().left - containerLeft) - nextShipX + 'px'
	)

	ship.style.left = nextShipX + "px";
}

function getAlignedMonster(idleBullet) {
	const exBulletStartY = exBulletEndY - exBulletHeight
	// distance of idleBullet's middle from left
	const bullletMidX = idleBullet.getBoundingClientRect().right - exBulletWidth / 2 - containerLeft;
	const alignedMonster =
	Array.from(document.querySelectorAll(".monster"))
	.filter(function (monster) {
		const monsterRect = monster.getBoundingClientRect()
		// distance of monster's end to top of container
		const monsterEndY = monsterRect.bottom - containerTop;
		// distance from the left of monster's start
		// plus a few pixels for clear hit
		const monsterStartX = (monsterRect.left + exMonsterWidth / 5) - containerLeft;
		// distance from the left of monster's end
		// minus the image spacing for clear hit
		const monsterEndX =
		(monsterRect.right -
			exMonsterWidth / 5) -
		containerLeft;

		if (
			bullletMidX > monsterStartX &&
			bullletMidX < monsterEndX &&
			monsterEndY > 10 &&
			exBulletEndY - exBulletHeight > monsterEndY
		)
			return monster;
	})
	.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];

	return alignedMonster;
}

function shoot() {
	const idleBullet = bullets
	.filter(bullet => !bullet.dataset.transitioning)[0]

	if (!idleBullet) return;
	playAudio(document.querySelector("#shoot-sound"));

	let distance = exBulletEndY,
	transDur;
	// the monster player is bltTransing at
	const alignedMonster = getAlignedMonster(idleBullet);

	if (alignedMonster) {
		const alignedMonsterEndY = alignedMonster.getBoundingClientRect().bottom - containerTop
		// distance from 1/4 of monster to idleBullet
		distance =
		(exBulletEndY -
			alignedMonsterEndY) +
		exMonsterHeight / 3;
	}

	// 2.45ms should be taken to travell each pixel
	transDur = distance * 0.45

	idleBullet.style.transitionDuration = transDur + "ms";
	idleBullet.style.transform = `translateY(${-distance}px)`;

	if (alignedMonster) setTimeout(() => reduceMonsterHealth(alignedMonster), transDur);

	setTimeout(function () {
		if (fingerOnShip) shoot()
	},
		firetime)
}

function reduceMonsterHealth(monster) {
	const monsterHealth = monster.querySelector(".monster__health");
	const monsterHealthBar = monster.querySelector(".monster__health__bar");
	let scoreInt = scoreDiv.innerText;

	monsterHealth.style.opacity = 1;
	monsterHealthBar.dataset.health -= 10;
	monsterHealthBar.style.width = monsterHealthBar.dataset.health + "%";

	if (monsterHealthBar.dataset.health === '0') {
		playAudio(document.querySelector("#monster-killed-sound"));
		setMonster(monster);
		++scoreInt;
		scoreDiv.innerText = scoreInt < 10 ? "0" + scoreInt: scoreInt;
	}
	// show the health for only 50ms
	monsterHealth.addEventListener('transitionend', () => setTimeout(() => monsterHealth.style.opacity = 0, 50))
}

function resetBullet(activeBullet) {
	activeBullet.style.transitionDuration = "0s";
	activeBullet.style.left = 'auto'
	activeBullet.style.transform = "translateY(0)";
}

/* monster part */

function createMonster() {
	const newMonster = exMonster.cloneNode(true);

	newMonster.addEventListener('animationend', function (e) {
		playAudio(document.querySelector("#heart-lost-sound"));
		newMonster.dataset.animating = ''
		heart.classList.add("shake");
		heart.addEventListener("animationend", () =>
			heart.classList.remove("shake")
		);
		playerLives.innerText--;

		if (playerLives.innerText === "0") {
			setTimeout(
				() => playAudio(document.querySelector("#game-over-sound")),
				2000
			);
			clearInterval(moveMonsterDownId); // stop creating monsters
			Array.from(monstersContainer.children)
			.forEach(monster => setMonster(monster));
			return;
		}
		setMonster(newMonster)
	});
	return newMonster;
}

(function handleMonster() {
	const totalMonsters = 5;
	let i = monstersContainer.children.length
	setMonster(exMonster)
	while (i < totalMonsters) {
		const monster = createMonster()
		setMonster(monster)
		monstersContainer.appendChild(monster)
		i++;
	}
})()

function setMonster(monster) {
	const space = 15;
	const maxX = containerWidth - exMonsterWidth - space;
	const x = randomInt(space,
		maxX);

	monster.classList.remove('move-down')
	monster.style.left = x + "px";
	monster.dataset.animating = ''
	monster.querySelector(".monster__health__bar").dataset.health = '100'
}

function moveMonsterDown() {
	const idleMonsters =
	Array.from(monstersContainer.querySelectorAll(".monster"))
	.filter(monster => !monster.dataset.animating)
	const rdmIndex = randomInt(0,
		idleMonsters.length - 1)
	const rdmIdleMonster = idleMonsters[rdmIndex]

	if (!rdmIdleMonster) return;
	if (spawnTime != 2000) spawnTime -= 100;

	monsterSpeed -= .3
	idleMonsters.forEach(function(idleMonster, index) {
		if (index !== rdmIndex) setAnimDur(idleMonster, monsterSpeed)
	})

	rdmIdleMonster.style.animationDelay = randomInt(0,
		3000) + 'ms'
	rdmIdleMonster.classList.add('move-down')
	rdmIdleMonster.dataset.animating = 'true'
}

ship.addEventListener("touchstart", function (e) {
	// check for cheaters and shoot only after idleBullet has finished travelling its distance
	if (!e.isTrusted) return;
	shipOffsetX = e.targetTouches[0].clientX - ship.getBoundingClientRect().left
	debounce(shoot, firetime, true)();
	fingerOnShip = true;
});
ship.addEventListener("touchend", () => (fingerOnShip = false));
ship.addEventListener("touchmove", moveShip);

bullets
.forEach(bullet => bullet
	.addEventListener("transitionstart", () => bullet.dataset.transitioning = "true"));
bullets
.forEach(bullet => bullet
	.addEventListener("transitionend", function (e) {
		bullet.dataset.transitioning = '';
		resetBullet(bullet);
	}));

window.addEventListener("orientationchange", () =>
	window.location.reload(true)
);