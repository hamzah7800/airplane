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

  // Wrap around screen
  if (plane.x < 0) plane.x = canvas.width;
  if (plane.x > canvas.width) plane.x = 0;
  if (plane.y < 0) plane.y = canvas.height;
  if (plane.y > canvas.height) plane.y = 0;
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlane();
  drawPlane();
  requestAnimationFrame(loop);
}

loop();
