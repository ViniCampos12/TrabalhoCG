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
      plataformMove: '../0_assetsT3/sounds/plataformaMovendo.wav'
    };

    // Carrega todos os sons
    this.loadAllSounds();
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