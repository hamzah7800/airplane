
function checkCode() {
  const code = document.getElementById("helperCode").value;
  if (code === "spawn_helper") {
    spawnHelper();
  }
}

const game = {
  helpers: []
};

function spawnHelper() {
  const helper = createHelper();
  game.helpers.push(helper);
}

function createHelper() {
  const helper = {
    x: player.x + 10,
    y: player.y,
    shootInterval: setInterval(() => {
      shootEnemy(helper.x, helper.y);
    }, 1000)
  };
  return helper;
}

function shootEnemy(x, y) {
  const target = findNearestEnemy(x, y);
  if (target) {
    target.health -= 10;
    console.log(`Helper shot enemy at (${target.x}, ${target.y})`);
  }
}

// Mocked player and findNearestEnemy for completeness
const player = { x: 50, y: 50 };
function findNearestEnemy(x, y) {
  return { x: 60, y: 60, health: 100 };
}
