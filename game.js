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

let plane, input, bullets, enemies, powerUps, particles, score, health, targetHealth, canShoot, reloading, gameOver;
let isDay = true;
let dayNightTimer = Date.now();
const stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.5 + 0.5,
  twinkle: Math.random() * 0.05 + 0.02,
  alpha: Math.random()
}));
const clouds = Array.from({ length: 5 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height / 2,
  speed: 0.2 + Math.random() * 0.3,
}));

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
  powerUps = [];
  particles = [];
  score = 0;
  health = 100;
  targetHealth = 100;
  canShoot = true;
  reloading = false;
  gameOver = false;
  gameOverScreen.style.display = "none";
  reloadText.style.display = "none";
  healthBar.style.width = "100%";
  scoreText.textContent = "Score: 0";
  dayNightTimer = Date.now();
}

resetGame();

// ================= CONTROLS =================
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

// ================= SHOOTING =================
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

// ================= PLANE =================
function drawPlane() {
  ctx.save();
  ctx.translate(plane.x, plane.y);
  ctx.rotate(plane.angle);
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

// ================= BULLETS =================
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

// ================= ENEMIES =================
function spawnEnemy() {
  if (gameOver) return;
  const y = Math.random() * canvas.height;
  const type = Math.random() < 0.5 ? "fast" : "tank";
  if (type === "fast") {
    enemies.push({ x: canvas.width + 30, y, speed: 4, radius: 15, type });
  } else {
    enemies.push({ x: canvas.width + 30, y, speed: 1.5, radius: 30, type });
  }
}

function updateEnemies() {
  enemies.forEach(e => e.x -= e.speed);
  enemies = enemies.filter(e => e.x + e.radius > 0);
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.fillStyle = e.type === "fast" ? "orange" : "red";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ================= POWERUPS =================
function spawnPowerUp() {
  if (Math.random() < 0.5) {
    powerUps.push({ x: canvas.width + 30, y: Math.random() * canvas.height, type: "health", speed: 2 });
  } else {
    powerUps.push({ x: canvas.width + 30, y: Math.random() * canvas.height, type: "rapid", speed: 2 });
  }
}

function updatePowerUps() {
  powerUps.forEach(p => p.x -= p.speed);
  powerUps = powerUps.filter(p => p.x > -30);
}

function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.fillStyle = p.type === "health" ? "lime" : "cyan";
    ctx.beginPath();
    ctx.rect(p.x - 10, p.y - 10, 20, 20);
    ctx.fill();
  });
}

// ================= PARTICLES (EXPLOSIONS) =================
function spawnExplosion(x, y, color) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30,
      color
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ================= SKY =================
function drawSky() {
  ctx.fillStyle = isDay ? "#87CEEB" : "#000022";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isDay) {
    ctx.fillStyle = "white";
    stars.forEach(s => {
      s.alpha += (Math.random() - 0.5) * s.twinkle;
      s.alpha = Math.max(0.2, Math.min(1, s.alpha));
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  } else {
    clouds.forEach(cloud => {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, 40, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      cloud.x -= cloud.speed;
      if (cloud.x < -80) {
        cloud.x = canvas.width + Math.random() * 100;
        cloud.y = Math.random() * canvas.height / 2;
      }
    });
  }

  drawSunAndMoon();
}

function drawSunAndMoon() {
  const now = Date.now();
  const elapsed = (now - dayNightTimer) / 1000;
  if (elapsed >= 180) {
    isDay = !isDay;
    dayNightTimer = now;
  }

  const progress = (elapsed % 180) / 180;
  const sunX = canvas.width * progress;
  const moonX = canvas.width * ((progress + 0.5) % 1);

  if (isDay) {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(sunX, 100, 30, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.arc(moonX, 100, 25, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================= COLLISIONS =================
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
        spawnExplosion(e.x, e.y, "orange");
      }
    });
  });

  enemies.forEach((e, i) => {
    const dx = e.x - plane.x;
    const dy = e.y - plane.y;
    if (Math.hypot(dx, dy) < e.radius + 32) {
      enemies.splice(i, 1);
      targetHealth -= 20;
      if (targetHealth < 0) targetHealth = 0;
      if (targetHealth <= 0) endGame();
    }
  });

  powerUps.forEach((p, i) => {
    const dx = p.x - plane.x;
    const dy = p.y - plane.y;
    if (Math.hypot(dx, dy) < 40) {
      if (p.type === "health") {
        targetHealth = Math.min(100, targetHealth + 30);
      } else if (p.type === "rapid") {
        canShoot = true;
        reloading = false;
        reloadText.style.display = "none";
      }
      powerUps.splice(i, 1);
    }
  });
}

// ================= GAME STATE =================
function endGame() {
  gameOver = true;
  gameOverScreen.style.display = "block";
}

function restartGame() {
  resetGame();
}

function updateHealthBar() {
  health += (targetHealth - health) * 0.1; // smooth animation
  healthBar.style.width = `${health}%`;
}

// ================= LOOP =================
function loop() {
  drawSky();
  if (!gameOver) {
    updatePlane();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    updateParticles();
    checkCollisions();
    updateHealthBar();
  }
  drawPlane();
  drawBullets();
  drawEnemies();
  drawPowerUps();
  drawParticles();
  requestAnimationFrame(loop);
}

setInterval(spawnEnemy, 3000);
setInterval(spawnPowerUp, 10000);
loop();
