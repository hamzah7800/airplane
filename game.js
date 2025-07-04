
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
let helpers = [];
let armors = [];
let lastLevelUpScore = 0;

function spawnArmor(x, y) {
  armors.push({ x, y, alpha: 0, active: true });
}

function spawnHelper(x, y) {
  helpers.push({ x, y, alpha: 0, angle: 0 });
}

function findNearestEnemy(x, y) {
  let nearest = null;
  let minDist = Infinity;
  for (const e of enemies) {
    const dx = e.x - x;
    const dy = e.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = e;
    }
  }
  return nearest;
}

function updateLevelUp() {
  if (score - lastLevelUpScore >= 100) {
    spawnArmor(plane.x + 30, plane.y);
    spawnHelper(plane.x - 30, plane.y);
    lastLevelUpScore = score;
  }
}

function updateHelpers() {
  for (const helper of helpers) {
    if (helper.alpha < 1) helper.alpha += 0.02;
    helper.x = plane.x - 30 * Math.cos(helper.angle);
    helper.y = plane.y - 30 * Math.sin(helper.angle);
    helper.angle += 0.05;
    const target = findNearestEnemy(helper.x, helper.y);
    if (target && Math.random() < 0.05) {
      const angle = Math.atan2(target.y - helper.y, target.x - helper.x);
      bullets.push({
        x: helper.x,
        y: helper.y,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7
      });
    }
  }
}

function updateArmors() {
  for (const armor of armors) {
    if (armor.alpha < 1) armor.alpha += 0.02;
    const dx = plane.x - armor.x;
    const dy = plane.y - armor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30 && armor.active) {
      health = Math.min(health + 20, 100);
      armor.active = false;
    }
  }
}

function drawHelpers() {
  for (const helper of helpers) {
    ctx.save();
    ctx.globalAlpha = helper.alpha;
    ctx.beginPath();
    ctx.arc(helper.x, helper.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "cyan";
    ctx.fill();
    ctx.restore();
  }
}

function drawArmors() {
  for (const armor of armors) {
    if (!armor.active) continue;
    ctx.save();
    ctx.globalAlpha = armor.alpha;
    ctx.beginPath();
    ctx.arc(armor.x, armor.y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = "limegreen";
    ctx.fill();
    ctx.restore();
  }
}
