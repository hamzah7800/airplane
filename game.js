const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const airplaneImg = new Image();
airplaneImg.src = "https://icons.iconarchive.com/icons/iconblock/remixed/64/Plane-icon.png";

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const shootButton = document.getElementById("shootButton");
const healthBar = document.getElementById("health");
const scoreText = document.getElementById("scoreText");
const reloadText = document.getElementById("reloadText");
const gameOverScreen = document.getElementById("gameOverScreen");

let plane, input, bullets, enemies, score, health, canShoot, reloading, gameOver;

function resetGame() {
  plane = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    accel: 0.2,
    friction: 0.98,
    maxSpeed: 5,
    rotationSpeed: 0.05,
  };
  input = { dx: 0, dy: 0 };
  bullets = [];
  enemies = [];
  score = 0;
  health = 100;
  canShoot = true;
  reloading = false;
  gameOver = false;
  gameOverScreen.style.display = "none";
  reloadText.style.display = "none";
  healthBar.style.width = "100%";
  scoreText.textContent = "Score: 0";
}

resetGame();

joystick.addEventListener("touchmove", (e) => {
  const rect = joystick.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left - 60;
  const y = touch.clientY - rect.top - 60;
  const max = 40;
  const dist = Math.min(Math.hypot(x, y), max);
  const angle = Math.atan2(y, x);
  input.dx = Math.cos(angle) * dist / max;
  input.dy = Math.sin(angle) * dist / max;
  stick.style.transform = `translate(${input.dx * max}px, ${input.dy * max}px)`;
});

joystick.addEventListener("touchend", () => {
  input = { dx: 0, dy: 0 };
  stick.style.transform = `translate(0px, 0px)`;
});

shootButton.addEventListener("touchstart", shoot);

function shoot() {
  if (!canShoot || reloading || gameOver) return;
  bullets.push({
    x: plane.x + Math.cos(plane.angle) * 20,
    y: plane.y + Math.sin(plane.angle) * 20,
    angle: plane.angle,
    speed: 10,
  });
  canShoot = false;
  reloadText.style.display = "block";
  reloading = true;
  setTimeout(() => {
    canShoot = true;
    reloading = false;
    reloadText.style.display = "none";
  }, 600); // 600ms reload
}

function drawPlane() {
  ctx.save();
  ctx.translate(plane.x, plane.y);
  ctx.rotate(plane.angle + Math.PI / 2);
  ctx.drawImage(airplaneImg, -32, -32, 64, 64);
  ctx.restore();
}

function updatePlane() {
  plane.angle += input.dx * plane.rotationSpeed;
  let thrust = input.dy * plane.accel;
  plane.vx += Math.cos(plane.angle) * thrust;
  plane.vy += Math.sin(plane.angle) * thrust;
  plane.vx *= plane.friction;
  plane.vy *= plane.friction;
  plane.x += plane.vx;
  plane.y += plane.vy;
  if (plane.x < 0) plane.x = canvas.width;
  if (plane.x > canvas.width) plane.x = 0;
  if (plane.y < 0) plane.y = canvas.height;
  if (plane.y > canvas.height) plane.y = 0;
}

function updateBullets() {
  bullets.forEach(b => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
  });
  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnEnemy() {
  if (gameOver) return;
  const y = Math.random() * canvas.height;
  enemies.push({ x: canvas.width + 30, y: y, speed: 2, radius: 20 });
}

function updateEnemies() {
  enemies.forEach(e => e.x -= e.speed);
  enemies = enemies.filter(e => e.x + e.radius > 0);
}

function drawEnemies() {
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function checkCollisions() {
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (Math.hypot(dx, dy) < e.radius + 4) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score++;
        scoreText.textContent = `Score: ${score}`;
      }
    });
  });

  enemies.forEach((e, i) => {
    const dx = e.x - plane.x;
    const dy = e.y - plane.y;
    if (Math.hypot(dx, dy) < e.radius + 32) {
      enemies.splice(i, 1);
      health -= 20;
      if (health < 0) health = 0;
      healthBar.style.width = `${health}%`;
      if (health <= 0) {
        endGame();
      }
    }
  });
}

function endGame() {
  gameOver = true;
  gameOverScreen.style.display = "block";
}

function restartGame() {
  resetGame();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameOver) {
    updatePlane();
    updateBullets();
    updateEnemies();
    checkCollisions();
  }
  drawPlane();
  drawBullets();
  drawEnemies();
  requestAnimationFrame(loop);
}

setInterval(spawnEnemy, 3000); // fewer enemies
loop();
