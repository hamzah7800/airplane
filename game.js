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
let isDay = true;
let dayNightTimer = Date.now();
const stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.5 + 0.5,
}));
const clouds = Array.from({ length: 5 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height / 2,
  speed: 0.2 + Math.random() * 0.3,
}));

function resetGame() {
  try {
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
    dayNightTimer = Date.now();
  } catch (error) {
    console.error("Error resetting game:", error);
  }
}

resetGame();

joystick.addEventListener("touchmove", (e) => {
  try {
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
  } catch (error) {
    console.error("Error during joystick movement:", error);
  }
});

joystick.addEventListener("touchend", () => {
  input = { dx: 0, dy: 0 };
  stick.style.transform = `translate(0px, 0px)`;
});

shootButton.addEventListener("touchstart", shoot);

function shoot() {
  try {
    if (!canShoot || reloading || gameOver) return;

    let angle = plane.angle;

    // Auto-aim logic
    let nearestEnemy = null;
    let minDist = Infinity;
    for (const e of enemies) {
      const dx = e.x - plane.x;
      const dy = e.y - plane.y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist && dist < 300) {
        minDist = dist;
        nearestEnemy = e;
      }
    }

    if (nearestEnemy) {
      const dx = nearestEnemy.x - plane.x;
      const dy = nearestEnemy.y - plane.y;
      const targetAngle = Math.atan2(dy, dx);
      const diff = normalizeAngle(targetAngle - angle);
      if (Math.abs(diff) < 0.5) {  // aim assist cone
        angle += diff * 0.5; // soft lock/adjust
      }
    }

    bullets.push({
      x: plane.x + Math.cos(angle) * 20,
      y: plane.y + Math.sin(angle) * 20,
      angle: angle,
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
  } catch (error) {
    console.error("Error during shooting:", error);
  }
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function drawPlane() {
  ctx.save();
  ctx.translate(plane.x, plane.y);
  ctx.rotate(plane.angle);
  ctx.drawImage(airplaneImg, -32, -32, 64, 64);
  ctx.restore();
}

function updatePlane() {
  try {
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
  } catch (error) {
    console.error("Error updating plane:", error);
  }
}

function updateBullets() {
  try {
    bullets.forEach(b => {
      b.x += Math.cos(b.angle) * b.speed;
      b.y += Math.sin(b.angle) * b.speed;
    });
    bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
  } catch (error) {
    console.error("Error updating bullets:", error);
  }
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
  try {
    enemies.forEach(e => e.x -= e.speed);
    enemies = enemies.filter(e => e.x + e.radius > 0);
  } catch (error) {
    console.error("Error updating enemies:", error);
  }
}

function drawEnemies() {
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSky() {
  ctx.fillStyle = isDay ? "#87CEEB" : "#000022";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isDay) {
    ctx.fillStyle = "white";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
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

function checkCollisions() {
  try {
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
        if (health <= 0) endGame();
      }
    });
  } catch (error) {
    console.error("Error checking collisions:", error);
  }
}

function endGame() {
  gameOver = true;
  gameOverScreen.style.display = "block";
}

function restartGame() {
  resetGame();
}

function loop() {
  try {
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
  } catch (error) {
    console.error("Error in game loop:", error);
  }
}

setInterval(spawnEnemy, 3000);
loop();
