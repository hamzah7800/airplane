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

let skyTime = 0;
const dayDuration = 3 * 60 * 1000;

let clouds = [];
let stars = [];
const numClouds = 10;
const numStars = 60;

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

  clouds = Array.from({ length: numClouds }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height / 2,
    speed: 0.2 + Math.random() * 0.3,
    size: 50 + Math.random() * 50
  }));

  stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    brightness: Math.random() * 0.5 + 0.5
  }));
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
  }, 600);
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

function drawSky() {
  skyTime = (Date.now() % (dayDuration * 2));
  const t = skyTime % (dayDuration * 2);
  const isDay = t < dayDuration;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (isDay) {
    grad.addColorStop(0, "#87ceeb");
    grad.addColorStop(1, "#ffffff");
  } else {
    grad.addColorStop(0, "#001d3d");
    grad.addColorStop(1, "#000000");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const angle = (t / (dayDuration * 2)) * Math.PI * 2;
  const sunX = canvas.width / 2 + Math.cos(angle) * canvas.width / 3;
  const sunY = canvas.height / 2 + Math.sin(angle) * canvas.height / 3;
  const moonX = canvas.width / 2 - Math.cos(angle) * canvas.width / 3;
  const moonY = canvas.height / 2 - Math.sin(angle) * canvas.height / 3;

  if (isDay) drawClouds();
  else drawStars();

  ctx.beginPath();
  ctx.fillStyle = "yellow";
  ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds() {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.size, c.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    c.x -= c.speed;
    if (c.x + c.size < 0) {
      c.x = canvas.width + c.size;
      c.y = Math.random() * canvas.height / 2;
    }
  });
}

function drawStars() {
  stars.forEach(s => {
    ctx.beginPath();
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(s.brightness * skyTime / 1000));
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
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
  drawSky();
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

setInterval(spawnEnemy, 3000);
loop();
