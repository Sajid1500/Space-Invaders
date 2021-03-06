/* initial values */
const container = document.querySelector("#container");
const play = document.querySelector("#play");
const ship = document.querySelector("#ship");
const bullets = Array.from(document.querySelectorAll(".bullet"));
const exBullet = bullets[0];
const monstersContainer = document.querySelector("#monsters-container");
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
const containerLeft = container.offsetLeft;
const containerTop = container.offsetTop;
const exBulletEndY = exBullet.getBoundingClientRect().bottom - containerTop;

const scoreDiv = document.querySelector("#scoreboard__score");
const heart = document.querySelector("#player-health__heart");
const playerLives = document.querySelector("#player-health__lives");
// time taken to fire each bullet
const firetime = 400; //ms
// Define the debounced function
const debouncedShoot = debounce(shoot, firetime, true);

let fingerOnShip,
  shipOffsetX,
  monsterSpeed = 12, // px per ms
  moveMonsterDownId,
  bulletDmg = 30,
  maxMonsterDelay = 3000,
  spawnTime = 4500;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playAudio(audio) {
  audio.currentTime = 0;
  audio.play();
}

function setAnimDur(elem, durForPixel) {
  const elemStartBottom = containerHeight + exMonsterHeight * 2;
  const duration = elemStartBottom * (640 / containerHeight) * durForPixel;
  elem.style.animationDuration = duration + "ms";
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    }, wait);
    if (callNow) func.apply(context, args);
  };
}

function startGame() {
  const heartLossedSound = document.querySelector("#heart-lost-sound");
  moveMonsterDownId = setInterval(moveMonsterDown, spawnTime);
  document.querySelector("#keyframes").innerHTML = `@keyframes moveDown {
	to {
	transform: translateY(${containerHeight}px)
	}
  }`;
  container.style.animationDuration = containerHeight / 640 * 2000 + 'ms'
  heartLossedSound.addEventListener(
    "loadedmetadata",
    () => (heart.style.animationDuration = heartLossedSound.duration + "s")
  );

  setAnimDur(exMonster, monsterSpeed);
  handleMonster();
  //alert("click ok to continue")
};

function moveShip(e) {
  const activeBullets = Array.from(document.querySelectorAll(".bullet")).filter(
    (bullet) => bullet.dataset.transitioning
  );

  const nextShipX = e.targetTouches[0].clientX - shipOffsetX - containerLeft;

  if (nextShipX <= 0 || nextShipX >= containerWidth - shipWidth) return;

  activeBullets.forEach(
    (activeBullet) =>
      (activeBullet.style.left =
        activeBullet.getBoundingClientRect().left -
        containerLeft -
        nextShipX +
        "px")
  );

  ship.style.left = nextShipX + "px";
}

function getAlignedMonster(idleBullet) {
  const exBulletStartY = exBulletEndY - exBulletHeight;
  // distance of idleBullet's middle from left
  const bullletMidX =
    idleBullet.getBoundingClientRect().right -
    exBulletWidth / 2 -
    containerLeft;
  const alignedMonster = Array.from(document.querySelectorAll(".monster"))
    .filter(function (monster) {
      const monsterRect = monster.getBoundingClientRect();
      // distance of monster's end to top of container
      const monsterEndY = monsterRect.bottom - containerTop;
      // distance from the left of monster's start
      // plus a few pixels for clear hit
      const monsterStartX =
        monsterRect.left + exMonsterWidth / 5 - containerLeft;
      // distance from the left of monster's end
      // minus the image spacing for clear hit
      const monsterEndX =
        monsterRect.right - exMonsterWidth / 5 - containerLeft;

      if (
        bullletMidX > monsterStartX &&
        bullletMidX < monsterEndX &&
        monsterEndY > 10 &&
        exBulletEndY - exBulletHeight > monsterEndY
      )
        return monster;
    })
    .sort(
      (a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top
    )[0];

  return alignedMonster;
}

function shoot() {
  const idleBullet = bullets.filter(
    (bullet) => !bullet.dataset.transitioning
  )[0];

  if (!idleBullet) return;
  playAudio(document.querySelector("#shoot-sound"));

  let distance = exBulletEndY,
    transDur;
  // the monster player is bltTransing at
  const alignedMonster = getAlignedMonster(idleBullet);

  if (alignedMonster) {
    const alignedMonsterEndY =
      alignedMonster.getBoundingClientRect().bottom - containerTop;
    // distance from 1/4 of monster to idleBullet
    distance = exBulletEndY - alignedMonsterEndY + exMonsterHeight / 3;
  }
  // 2.45ms should be taken to travell each pixel
  transDur = distance * (640 / containerHeight) * 1.45;

  idleBullet.style.transitionDuration = transDur + "ms";
  idleBullet.style.transform = `translateY(${-distance}px)`;

  if (alignedMonster)
    setTimeout(() => reduceMonsterHealth(alignedMonster), transDur);

  setTimeout(function () {
    if (fingerOnShip) shoot();
  }, firetime);
}

function reduceMonsterHealth(monster) {
  const monsterHealth = monster.querySelector(".monster__health");
  const monsterHealthBar = monster.querySelector(".monster__health__bar");
  let monsterHealthInt = monsterHealthBar.dataset.health;
  let scoreInt = scoreDiv.innerText;

  monsterHealth.style.opacity = 1;
  monsterHealthInt -= bulletDmg;
  monsterHealthBar.dataset.health = monsterHealthInt;
  monsterHealthBar.style.width =
    (monsterHealthInt < 0 ? 0 : monsterHealthInt) + "%";

  if (monsterHealthInt <= 0) {
    playAudio(document.querySelector("#monster-killed-sound"));
    decBltDmg();
    setMonster(monster);
    ++scoreInt;
    scoreDiv.innerText = scoreInt < 10 ? "0" + scoreInt : scoreInt;
  }
  // show the health for only 50ms
  monsterHealth.addEventListener("transitionend", () =>
    setTimeout(() => (monsterHealth.style.opacity = 0), 50)
  );
}

function resetBullet(activeBullet) {
  activeBullet.style.transitionDuration = "0s";
  activeBullet.style.left = "auto";
  activeBullet.style.transform = "translateY(0)";
}

/* monster part */

function decBltDmg() {
  if (!(bulletDmg <= 10)) bulletDmg -= 0.6;
}

function addMonsterListener(monster) {
  monster.addEventListener("animationend", function (e) {
    playAudio(document.querySelector("#heart-lost-sound"));
    decBltDmg();
    monster.dataset.animating = "";
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
      Array.from(monstersContainer.children).forEach((monster) =>
        setMonster(monster)
      );
      return;
    }
    setMonster(monster);
  });
  return monster;
}
function handleMonster() {
  const totalMonsters = 5;
  let i = monstersContainer.children.length;
  addMonsterListener(exMonster);
  setMonster(exMonster);

  while (i < totalMonsters) {
    const newMonster = exMonster.cloneNode(true);
    addMonsterListener(exMonster);
    setMonster(newMonster);
    monstersContainer.appendChild(newMonster);
    i++;
  }
}

function setMonster(monster) {
  const monsterHealthBar = monster.querySelector(".monster__health__bar");
  const space = 15;
  const maxX = containerWidth - exMonsterWidth - space;
  const x = randomInt(space, maxX);

  monster.classList.remove("move-down");
  monster.style.left = x + "px";
  monster.dataset.animating = "";
  monsterHealthBar.dataset.health = "100";
  monsterHealthBar.style.width = "100%";
}

function moveMonsterDown() {
  const idleMonsters = Array.from(
    monstersContainer.querySelectorAll(".monster")
  ).filter((monster) => !monster.dataset.animating);
  const rdmIndex = randomInt(0, idleMonsters.length - 1);
  const rdmIdleMonster = idleMonsters[rdmIndex];
console.log(bulletDmg)
  if (!rdmIdleMonster) return;
  if (spawnTime != 2000) spawnTime -= 50;

  monsterSpeed -= 0.1;
  idleMonsters.forEach(function (idleMonster, index) {
    if (index !== rdmIndex) setAnimDur(idleMonster, monsterSpeed);
  });

  rdmIdleMonster.style.animationDelay = randomInt(300, maxMonsterDelay-=100) + "ms";
  rdmIdleMonster.classList.add("move-down");
  rdmIdleMonster.dataset.animating = "true";
}

play.addEventListener('click', function () {
  container.style.visibility = "visible";
  startGame()
})

ship.addEventListener("touchstart", function (e) {
  // check for cheaters
  if (!e.isTrusted) return;
  shipOffsetX = e.targetTouches[0].clientX - ship.getBoundingClientRect().left;
  debouncedShoot();
  fingerOnShip = true;
});
ship.addEventListener("touchend", () => (fingerOnShip = false));
ship.addEventListener("touchmove", moveShip);

bullets.forEach((bullet) =>
  bullet.addEventListener(
    "transitionstart",
    () => (bullet.dataset.transitioning = "true")
  )
);
bullets.forEach((bullet) =>
  bullet.addEventListener("transitionend", function (e) {
    bullet.dataset.transitioning = "";
    resetBullet(bullet);
  })
);

window.addEventListener("resize", () => location.reload());
// orientationchange
