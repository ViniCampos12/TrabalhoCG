function exibirMensagem() {
  
  // Remove mensagem anterior se existir
  const mensagemExistente = document.getElementById('mensagem-chaves');
  if (mensagemExistente) {
    mensagemExistente.remove();
  }

  // Cria o elemento da mensagem
  const mensagem = document.createElement('div');
  mensagem.id = 'mensagem-chaves';
  mensagem.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: #ffff00;
    padding: 30px;
    border-radius: 10px;
    border: 3px solid #ffff00;
    font-family: Arial, sans-serif;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    z-index: 9999;
    box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
    animation: fadeInOut 3s ease-in-out;
  `;

  // Mensagem sempre mostra que todas as chaves foram obtidas
  let conteudo = `
    <div style="font-size: 32px; color: #00ff00; margin-bottom: 20px;">🎉</div>
    <div style="font-size: 28px; color: #00ff00;">TODAS AS CHAVES</div>
    <div style="font-size: 28px; color: #00ff00; margin-bottom: 10px;">FORAM OBTIDAS!</div>
    <div style="color: #00ff00; margin: 5px 0;">✅ Chave da Área 1 - OBTIDA</div>
    <div style="color: #00ff00; margin: 5px 0;">✅ Chave da Área 2 - OBTIDA</div>
    <div style="color: #00ff00; margin: 5px 0;">✅ Chave da Área 3 - OBTIDA</div>
    <div style="font-size: 20px; color: #ffffff; margin-top: 15px;">🗝️ CHEAT ATIVADO 🗝️</div>
  `;

  mensagem.innerHTML = conteudo;

  // Adiciona a animação CSS (só uma vez)
  if (!document.getElementById('mensagem-styles')) {
    const style = document.createElement('style');
    style.id = 'mensagem-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
  }

  // Adiciona à página
  document.body.appendChild(mensagem);

  // Remove automaticamente após 3 segundos
  setTimeout(() => {
    if (mensagem && mensagem.parentNode) {
      mensagem.remove();
    }
  }, 3000);

  // Toca som de notificação se disponível
  if (window.soundManager && window.soundManager.playBeep) {
    window.soundManager.playBeep(600, 300);
  }

  console.log('CHEAT ATIVADO - Todas as chaves foram obtidas automaticamente!');
}

// Torna a função disponível globalmente
window.exibirMensagem = exibirMensagem;