const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let plane = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  speed: 0,
  maxSpeed: 5,
  rotationSpeed: 0.05,
};

let input = { dx: 0, dy: 0 };
let bullets = [];
let enemies = [];
let score = 0;

// Handle tap to shoot
canvas.addEventListener("touchstart", (e) => {
  if (e.target.closest("#joystick")) return;
  bullets.push({
    x: plane.x + Math.cos(plane.angle) * 20,
    y: plane.y + Math.sin(plane.angle) * 20,
    angle: plane.angle,
    speed: 8,
  });
});

// Joystick
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

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

function drawPlane() {
  ctx.save();
  ctx.translate(plane.x, plane.y);
  ctx.rotate(plane.angle);
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updatePlane() {
  plane.angle += input.dx * plane.rotationSpeed;
  plane.speed = input.dy * plane.maxSpeed;

  plane.x += Math.cos(plane.angle) * plane.speed;
  plane.y += Math.sin(plane.angle) * plane.speed;

  if (plane.x < 0) plane.x = canvas.width;
  if (plane.x > canvas.width) plane.x = 0;
  if (plane.y < 0) plane.y = canvas.height;
  if (plane.y > canvas.height) plane.y = 0;
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateBullets() {
  bullets.forEach((b) => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
  });

  // Remove offscreen bullets
  bullets = bullets.filter(
    (b) => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height
  );
}

function spawnEnemy() {
  const y = Math.random() * canvas.height;
  enemies.push({
    x: canvas.width + 40,
    y: y,
    speed: 2 + Math.random() * 2,
    radius: 15,
  });
}

function drawEnemies() {
  ctx.fillStyle = "red";
  enemies.forEach((e) => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateEnemies() {
  enemies.forEach((e) => {
    e.x -= e.speed;
  });

  enemies = enemies.filter((e) => e.x + e.radius > 0);
}

function checkCollisions() {
  bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (Math.hypot(dx, dy) < e.radius + 4) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score += 1;
      }
    });
  });
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "24px sans-serif";
  ctx.fillText(`Score: ${score}`, 20, 30);
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlane();
  updateBullets();
  updateEnemies();
  checkCollisions();

  drawPlane();
  drawBullets();
  drawEnemies();
  drawScore();

  requestAnimationFrame(loop);
}

// Start enemy spawner
setInterval(spawnEnemy, 1000);
loop();
