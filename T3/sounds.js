import * as THREE from 'three';

class SoundManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    
    this.sounds = {};
    this.audioLoader = new THREE.AudioLoader();
    
    this.initSounds();
  }

  initSounds() {
    // Define os sons disponíveis
    this.soundPaths = {
      chaingun: '../0_assetsT3/sounds/chaingunFiring.wav',
      rocketLauncher: '../0_assetsT3/sounds/rocketFiring.wav',
      keyPickup: '../0_assetsT3/sounds/chave.wav',
      doorOpen: '../0_assetsT3/sounds/doorOpening.wav',
      playerDamage: '../0_assetsT3/sounds/playerInjured.wav',
      plataformMove: '../0_assetsT3/sounds/plataformaMovendo.wav',
      backgroundMusic: '../0_assetsT3/sounds/doom.mp3',
      enemyHit: '../0_assetsT3/sounds/lostSoul/injured.wav',
      lostSoulAttack: '../0_assetsT3/sounds/lostSoul/lost_soul_attack.wav',
      enemyAttack: '../0_assetsT3/sounds/cacodemons/cacodemonAttack.wav',
      cacodemonAttack: '../0_assetsT3/sounds/cacoDemon/cacodemonAttack.wav',
      cacodemonDeath: '../0_assetsT3/sounds/cacoDemon/cacodemonDeath.wav',
      cacodemonSpawn: '../0_assetsT3/sounds/cacoDemon/cacodemonSight.wav',
      cacodemonNearby: '../0_assetsT3/sounds/cacoDemon/cacodemonNearby.wav'
    };

    // Carrega todos os sons
    this.loadAllSounds();
  }
  // FUNÇÃO SEPARADA PARA MÚSICA DE FUNDO
  playBackgroundMusic() {
    console.log('Tentando iniciar música de fundo...');
    
    if (this.sounds['backgroundMusic']) {
      try {
        // Para a música se já estiver tocando
        if (this.sounds['backgroundMusic'].isPlaying) {
          this.sounds['backgroundMusic'].stop();
        }
        
        // Configura a música
        this.sounds['backgroundMusic'].setLoop(true); // Loop infinito
        this.sounds['backgroundMusic'].setVolume(0.15); // Volume baixo
        
        // Toca a música
        this.sounds['backgroundMusic'].play();
        console.log('Música de fundo iniciada com sucesso!');
        
      } catch (error) {
        console.error('Erro ao tocar música de fundo:', error);
      }
    } else {
      console.warn('Música de fundo não carregada ainda');
    }
  }

  // FUNÇÃO PARA PARAR MÚSICA DE FUNDO
  stopBackgroundMusic() {
    if (this.sounds['backgroundMusic'] && this.sounds['backgroundMusic'].isPlaying) {
      this.sounds['backgroundMusic'].stop();
      console.log('Música de fundo parada');
    }
  }


  loadAllSounds() {
    Object.keys(this.soundPaths).forEach(soundName => {
      this.loadSound(soundName, this.soundPaths[soundName]);
    });
  }

  loadSound(name, path) {
    const sound = new THREE.Audio(this.listener);
    
    this.audioLoader.load(
      path,
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        this.sounds[name] = sound;
        console.log(`Som ${name} carregado com sucesso`);
      },
      (progress) => {
        // console.log(`Carregando ${name}: ${(progress.loaded / progress.total * 100)}%`);
      },
      (error) => {
        console.warn(`Erro ao carregar som ${name}:`, error);
        // Cria um som vazio para evitar erros
        this.sounds[name] = {
          play: () => {},
          stop: () => {},
          isPlaying: false,
          setVolume: () => {},
          setLoop: () => {}
        };
      }
    );
  }

  // Reproduz um som específico
  play(soundName, volume = 0.5, loop = false) {
    const sound = this.sounds[soundName];
    if (sound) {
      try {
        if (sound.isPlaying) sound.stop();
        sound.setVolume(volume);
        sound.setLoop(loop);
        sound.play();
      } catch (error) {
        console.warn(`Erro ao reproduzir som ${soundName}:`, error);
      }
    } else {
      console.warn(`Som ${soundName} não encontrado`);
    }
  }

  // Para um som específico
  stop(soundName) {
    const sound = this.sounds[soundName];
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  // Para todos os sons
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    });
  }

  // Define volume global
  setMasterVolume(volume) {
    this.listener.setMasterVolume(volume);
  }

  // Verifica se um som está tocando
  isPlaying(soundName) {
    const sound = this.sounds[soundName];
    return sound ? sound.isPlaying : false;
  }
  playLostSoulAttack(){
    this.play('enemyAttack', 0.7);
  }
  playCacodemonAttack(){
    this.play('cacodemonAttack', 0.7);
  }
  playCacodemonDeath() {
    this.play('cacodemonDeath', 0.7);
  }
  playCacodemonSpawn() {
    this.play('cacodemonSpawn', 0.7);
  }
  playCacodemonNearby() {
    this.play('cacodemonNearby', 0.7);
  }

  // Sons específicos do jogo
  playChaingun() {
    this.play('chaingun', 0.3, false);
  }

  playRocketLauncher() {
    this.play('rocketLauncher', 0.6, false);
  }

  playKeyPickup() {
    this.play('keyPickup', 0.4, false);
  }

  playDoorOpen() {
    this.play('doorOpen', 0.5, false);
  }

  playEnemyHit() {
    this.play('enemyHit', 0.4, false);
  }

  playPlataformMove() {
    this.play('plataformMove', 0.5, false);
  }
  playPlayerDamage() {
    this.play('playerDamage', 0.6, false);
  }

  playGameOver() {
    this.play('gameOver', 0.8, false);
  }

  playNotification() {
    this.play('notification', 0.5, false);
  }


}

export default SoundManager;