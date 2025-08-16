function exibirMensagemFinal() {
  console.log("Missão Cumprida!");
  
  // Desbloqueia os controles
  if (window.controls) {
    window.controls.unlock();
  }
  
  // Cria tela de vitória
  const victoryScreen = document.createElement('div');
  victoryScreen.id = 'victory-screen';
  victoryScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: 'Arial Black', sans-serif;
    z-index: 2000;
    animation: fadeIn 1s ease-out forwards;
  `;
  
  // Mensagem principal
  const victoryText = document.createElement('h1');
  victoryText.textContent = 'MISSÃO CUMPRIDA!';
  victoryText.style.cssText = `
    color: #4CAF50;
    font-size: 72px;
    margin-bottom: 30px;
    text-shadow: 0 0 20px rgba(76, 175, 80, 0.7);
    text-align: center;
  `;
  
  // Mensagem secundária
  const subText = document.createElement('p');
  subText.textContent = 'Você derrotou todos os inimigos e completou sua missão!';
  subText.style.cssText = `
    font-size: 24px;
    margin-bottom: 40px;
    text-align: center;
    max-width: 80%;
  `;
  
  // Botão de reiniciar (estilo igual ao Game Over)
  const restartButton = document.createElement('button');
  restartButton.textContent = 'Jogar Novamente';
  restartButton.style.cssText = `
    padding: 15px 40px;
    font-size: 22px;
    font-weight: bold;
    background: linear-gradient(to bottom, #4CAF50, #388E3C);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  `;
  
  // Efeitos hover no botão
  restartButton.onmouseover = () => {
    restartButton.style.transform = 'translateY(-3px)';
    restartButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
    restartButton.style.background = 'linear-gradient(to bottom, #66BB6A, #43A047)';
  };
  
  restartButton.onmouseout = () => {
    restartButton.style.transform = 'translateY(0)';
    restartButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    restartButton.style.background = 'linear-gradient(to bottom, #4CAF50, #388E3C)';
  };
  
  restartButton.onclick = () => {
    location.reload(); // Recarrega a página para reiniciar
  };
  
  // Adiciona elementos à tela
  victoryScreen.appendChild(victoryText);
  victoryScreen.appendChild(subText);
  victoryScreen.appendChild(restartButton);
  
  // Adiciona à página
  document.body.appendChild(victoryScreen);
  
  // Toca som de vitória se disponível
  if (window.soundManager && window.soundManager.playVictory) {
    window.soundManager.playVictory();
  }
  
  // Adiciona animação de fadeIn se não existir
  if (!document.getElementById('screen-styles')) {
    const style = document.createElement('style');
    style.id = 'screen-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Torna a função acessível globalmente
window.exibirMensagemFinal = exibirMensagemFinal;   