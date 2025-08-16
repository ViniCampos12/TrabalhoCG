import * as THREE from 'three'; // ← ADICIONE ESTA LINHA
// HP DO JOGADOR
let playerHP = 200;
const maxPlayerHP = 200;

let godModeEnabled = false;

// Variáveis para controle de dano
const damageFlags = new Map(); // Para controlar cooldown de dano

function toggleGodMode() {
  godModeEnabled = !godModeEnabled;
  
  // Mostra mensagem visual
  showGodModeMessage(godModeEnabled);
  
  console.log(`God Mode ${godModeEnabled ? 'ATIVADO' : 'DESATIVADO'}`);
  return godModeEnabled;
}

function showGodModeMessage(enabled) {
  // Remove mensagem anterior
  const existingMessage = document.getElementById('godmode-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const message = document.createElement('div');
  message.id = 'godmode-message';
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${enabled ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)'};
    color: white;
    padding: 20px 40px;
    border-radius: 10px;
    font-family: Arial, sans-serif;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    z-index: 9999;
    border: 3px solid ${enabled ? '#00ff00' : '#ff0000'};
    box-shadow: 0 0 20px ${enabled ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'};
  `;

  message.innerHTML = enabled ? 
    '⚡ GOD MODE ATIVADO ⚡<br><div style="font-size: 16px; margin-top: 10px;">Você é invencível!</div>' :
    '❌ GOD MODE DESATIVADO ❌<br><div style="font-size: 16px; margin-top: 10px;">Você pode receber dano novamente</div>';

  document.body.appendChild(message);

  // Remove automaticamente após 2 segundos
  setTimeout(() => {
    if (message && message.parentNode) {
      message.remove();
    }
  }, 2000);
}


// Cria interface de HP
function createPlayerHPInterface() {
  // Container principal da UI
  const hpContainer = document.createElement('div');
  hpContainer.id = 'hp-container';
  hpContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 300px;
    height: 40px;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #666;
    border-radius: 5px;
    padding: 5px;
    font-family: Arial, sans-serif;
    z-index: 1000;
  `;

  // Texto do HP
  const hpText = document.createElement('div');
  hpText.id = 'hp-text';
  hpText.style.cssText = `
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 5px;
  `;
  hpText.textContent = `HP: ${playerHP} / ${maxPlayerHP}`;

  // Barra de fundo
  const hpBarBackground = document.createElement('div');
  hpBarBackground.style.cssText = `
    width: 100%;
    height: 20px;
    background: #444;
    border-radius: 3px;
    overflow: hidden;
  `;

  // Barra de HP
  const hpBar = document.createElement('div');
  hpBar.id = 'hp-bar';
  hpBar.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #ff0000 0%, #ffff00 50%, #00ff00 100%);
    transition: width 0.3s ease;
    border-radius: 3px;
  `;

  hpBarBackground.appendChild(hpBar);
  hpContainer.appendChild(hpText);
  hpContainer.appendChild(hpBarBackground);
  document.body.appendChild(hpContainer);
}

// Atualiza a interface de HP
function updatePlayerHPInterface() {
  const hpText = document.getElementById('hp-text');
  const hpBar = document.getElementById('hp-bar');
  
  if (hpText && hpBar) {
    hpText.textContent = `HP: ${playerHP} / ${maxPlayerHP}`;
    const hpPercentage = (playerHP / maxPlayerHP) * 100;
    hpBar.style.width = `${hpPercentage}%`;
    
    // Muda a cor baseado no HP
    if (hpPercentage > 66) {
      hpBar.style.background = '#00ff00'; // Verde
    } else if (hpPercentage > 33) {
      hpBar.style.background = '#ffff00'; // Amarelo
    } else {
      hpBar.style.background = '#ff0000'; // Vermelho
    }
  }
}

// Função para receber dano
function takeDamage(damage) {
  if(godModeEnabled) {
    return;
  }
  playerHP = Math.max(0, playerHP - damage);
  updatePlayerHPInterface();
  
  // Efeito visual de dano (flash vermelho)
  const damageOverlay = document.getElementById('damage-overlay') || createDamageOverlay();
  damageOverlay.style.opacity = '0.3';
  setTimeout(() => {
    damageOverlay.style.opacity = '0';
  }, 200);
  
  console.log(`Jogador recebeu ${damage} de dano. HP atual: ${playerHP}`);
  
  if (playerHP <= 0) {
    gameOver();
  }
}

// Cria overlay de dano
function createDamageOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'damage-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: red;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    z-index: 999;
  `;
  document.body.appendChild(overlay);
  return overlay;
}

// Game Over
function gameOver() {
  console.log("Game Over!");
  
  // Para o jogo - precisa de acesso aos controles do game.js
  if (window.controls) {
    window.controls.unlock();
  }
  
  // Cria tela de game over
  const gameOverScreen = document.createElement('div');
  gameOverScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: Arial, sans-serif;
    z-index: 2000;
  `;
  
  const gameOverText = document.createElement('h1');
  gameOverText.textContent = 'GAME OVER';
  gameOverText.style.cssText = `
    color: red;
    font-size: 48px;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  `;
  
  const restartButton = document.createElement('button');
  restartButton.textContent = 'Reiniciar';
  restartButton.style.cssText = `
    padding: 15px 30px;
    font-size: 20px;
    background: #666;
    color: white;
    border: 2px solid #888;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;
  `;
  restartButton.onmouseover = () => restartButton.style.background = '#888';
  restartButton.onmouseout = () => restartButton.style.background = '#666';
  restartButton.onclick = () => {
    location.reload(); // Recarrega a página
  };
  
  gameOverScreen.appendChild(gameOverText);
  gameOverScreen.appendChild(restartButton);
  document.body.appendChild(gameOverScreen);
}

// --- helper: testa se o raio do SOLDADO até o PLAYER cruza a box ENTRE os dois
function rayHitsBoxBetween(origin, target, box) {
  const dir = new THREE.Vector3().subVectors(target, origin).normalize();
  const ray = new THREE.Ray(origin.clone(), dir);

  const hitPoint = new THREE.Vector3();
  const res = ray.intersectBox(box, hitPoint); // retorna ponto de impacto ou null
  if (!res) return false;

  // garante que o ponto está entre origin e target (não atrás nem além do player)
  const distToHit = origin.distanceTo(hitPoint);
  const distToTarget = origin.distanceTo(target);
  return distToHit < distToTarget - 1e-3; // margem pequena
}

// Ativa/Desativa God Mode com a tecla G
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyG") {
    godModeEnabled = !godModeEnabled;
    console.log("God Mode:", godModeEnabled ? "ON" : "OFF");
  }
});

// Verifica colisão de dano com inimigos
function checkPlayerDamage(playerPosition, enemies, playerMesh, area3Boxes) {
  if (godModeEnabled) {
    return false;
  }

  const playerBB = new THREE.Box3().setFromObject(playerMesh).expandByScalar(0.5);
  let damageReceived = false;

  // ---------------- Lost Souls ----------------
  if (enemies.lostSouls) {
    for (const soul of enemies.lostSouls) {
      if (soul.hp <= 0) continue;

      const soulBB = new THREE.Box3().setFromObject(soul.mesh);
      if (playerBB.intersectsBox(soulBB)) {
        const soulId = soul.mesh.uuid;
        if (!damageFlags.has(soulId)) {
          takeDamage(5);
          damageReceived = true;
          damageFlags.set(soulId, true);

          setTimeout(() => {
            damageFlags.delete(soulId);
          }, 1000);
        }
      }
    }
  }

  // ---------------- Projéteis Cacodemon ----------------
  if (!damageReceived && enemies.projectiles) {
    for (let i = enemies.projectiles.length - 1; i >= 0; i--) {
      const projectile = enemies.projectiles[i];
      if (!projectile || !projectile.mesh) continue;

      const origin = projectile.prevPos ? projectile.prevPos.clone() : projectile.mesh.position.clone();
      const target = projectile.mesh.position.clone();

      const dir = new THREE.Vector3().subVectors(target, origin);
      const distance = dir.length();
      if (distance === 0) continue;
      dir.normalize();

      const ray = new THREE.Ray(origin, dir);
      const tmp = new THREE.Vector3();
      const hit = ray.intersectBox(playerBB, tmp);

      if (hit && origin.distanceTo(tmp) <= distance + 1e-3) {
        console.log("Player atingido por projétil do Cacodemon!", tmp);
        takeDamage(15);
        damageReceived = true;

        if (projectile.mesh.parent) {
          projectile.mesh.parent.remove(projectile.mesh);
        } else {
          scene.remove(projectile.mesh);
        }
        enemies.projectiles.splice(i, 1);
        continue;
      }

      projectile.prevPos = projectile.mesh.position.clone();
    }
  }

  // ---------------- Soldados (Raycaster) ----------------
  if (!damageReceived && enemies.soldiers) {
    for (const soldier of enemies.soldiers) {
      if (!soldier.lastShotTime) continue;
      if (Date.now() - soldier.lastShotTime < 200) continue;

      const origin = soldier.mesh.position.clone();
      origin.y += 5;

      const direction = new THREE.Vector3().subVectors(playerMesh.position, origin).normalize();
      const raycaster = new THREE.Raycaster(origin, direction);

      const intersects = raycaster.intersectObjects(area3Boxes, true);
      const distanceToPlayer = origin.distanceTo(playerMesh.position);

      if (intersects.length === 0 || intersects[0].distance > distanceToPlayer) {
        takeDamage(2);
        damageReceived = true;
        console.log("Player atingido por tiro de soldado!");
        soldier.lastShotTime = Date.now();
      }
    }
  }

  return damageReceived;
}

  
//   // Verifica Soldiers (quando implementados)
//   if (enemies.soldiers) {
//     for (const soldier of enemies.soldiers) {
//       if (soldier.hp <= 0) continue;
      
//       const soldierBB = new THREE.Box3().setFromObject(soldier.mesh);
      
//       if (playerBB.intersectsBox(soldierBB)) {
//         const soldierId = soldier.mesh.uuid;
//         if (!damageFlags.has(soldierId)) {
//           takeDamage(2); // Soldier causa 2 de dano
//           damageFlags.set(soldierId, true);
          
//           setTimeout(() => {
//             damageFlags.delete(soldierId);
//           }, 1000);
//         }
//       }
//     }
//   }



// Função para resetar HP (para reiniciar o jogo)
function resetPlayerHP() {
  playerHP = maxPlayerHP;
  updatePlayerHPInterface();
  damageFlags.clear();
}

// Inicializa o sistema de HP
function initPlayerHP() {
  createPlayerHPInterface();
  createDamageOverlay();
  updatePlayerHPInterface();
}

// Getters para acessar valores
function getPlayerHP() {
  return playerHP;
}

function getMaxPlayerHP() {
  return maxPlayerHP;
}

function isPlayerAlive() {
  return playerHP > 0;
}

// Exporta as funções para serem usadas no game.js
export {
  initPlayerHP,
  takeDamage,
  resetPlayerHP,
  checkPlayerDamage,
  getPlayerHP,
  getMaxPlayerHP,
  isPlayerAlive,
  updatePlayerHPInterface,
  toggleGodMode
};

// Torna algumas funções globais para compatibilidade
if (typeof window !== 'undefined') {
  window.takeDamage = takeDamage;
   window.toggleGodMode = toggleGodMode;
  window.resetPlayerHP = resetPlayerHP;
  window.getPlayerHP = getPlayerHP;
  window.isPlayerAlive = isPlayerAlive;
}