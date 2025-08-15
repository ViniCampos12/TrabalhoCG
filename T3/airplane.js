import * as THREE from 'three';
import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '../build/jsm/loaders/MTLLoader.js';

class Airplane {
  constructor(scene) {
    this.scene = scene;
    this.airplaneMesh = null;
    this.loadAirplane();
  }

  loadAirplane() {
    const mtlLoader = new MTLLoader();
    
    // Carrega primeiro o arquivo MTL (materiais)
    mtlLoader.load('assets/plane.mtl', (materials) => {
      materials.preload();
      
      // Depois carrega o arquivo OBJ
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      
      objLoader.load('assets/plane.obj', (object) => {
        this.airplaneMesh = object;
        
        // Configurações de sombra
        this.airplaneMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Melhora a qualidade dos materiais
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        });

        // Posicionamento dentro da Área 3 (hangar)
        this.positionAirplane();
        
        // Adiciona à cena
        this.scene.add(this.airplaneMesh);
        
        console.log('Avião OBJ carregado com sucesso!');
        
      }, (progress) => {
        console.log('Progresso do carregamento OBJ:', (progress.loaded / progress.total * 100) + '%');
      }, (error) => {
        console.error('Erro ao carregar o arquivo OBJ:', error);
      });
      
    }, (progress) => {
      console.log('Progresso do carregamento MTL:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Erro ao carregar o arquivo MTL:', error);
    });
  }

  positionAirplane() {
    if (!this.airplaneMesh) return;

    // Posiciona o avião no centro do hangar (Área 3)
    this.airplaneMesh.position.set(
      156,  // x - centro do hangar
      0,    // y - no chão
      -110  // z - centro do hangar
    );

    // Rotaciona o avião para ficar voltado para a entrada
    this.airplaneMesh.rotation.y = Math.PI + Math.PI/2;  // 180 graus

    // Ajusta a escala se necessário (teste diferentes valores)
    this.airplaneMesh.scale.set(0.6, 0.6, 0.6);
    
    console.log('Avião posicionado em:', this.airplaneMesh.position);
  }

  // Predefinições de posicionamento
  setPresetPosition(preset) {
    if (!this.airplaneMesh) return;

    const positions = {
      center: { 
        x: 156, y: 2, z: -118, 
        rotation: Math.PI, 
        scale: 1 
      },
      left: { 
        x: 120, y: 2, z: -118, 
        rotation: Math.PI * 0.75, 
        scale: 0.8 
      },
      right: { 
        x: 192, y: 2, z: -118, 
        rotation: Math.PI * 1.25, 
        scale: 0.8 
      },
      back: { 
        x: 156, y: 2, z: -150, 
        rotation: Math.PI, 
        scale: 1.2 
      },
      front: { 
        x: 156, y: 2, z: -90, 
        rotation: 0, 
        scale: 0.9 
      },
      showcase: { 
        x: 156, y: 5, z: -118, 
        rotation: Math.PI * 0.9, 
        scale: 1.5 
      }
    };

    const pos = positions[preset] || positions.center;
    
    this.airplaneMesh.position.set(pos.x, pos.y, pos.z);
    this.airplaneMesh.rotation.y = pos.rotation;
    this.airplaneMesh.scale.set(pos.scale, pos.scale, pos.scale);
    
    console.log(`Avião posicionado em preset: ${preset}`);
  }

  // Função para rotacionar o avião continuamente (efeito showcase)
  startRotation() {
    if (!this.airplaneMesh) return;
    
    const rotateAnimation = () => {
      if (this.airplaneMesh) {
        this.airplaneMesh.rotation.y += 0.01;
        requestAnimationFrame(rotateAnimation);
      }
    };
    rotateAnimation();
  }

  // Função para mover o avião manualmente
  moveAirplane(x, y, z) {
    if (this.airplaneMesh) {
      this.airplaneMesh.position.set(x, y, z);
    }
  }

  // Função para ajustar escala
  setScale(scale) {
    if (this.airplaneMesh) {
      this.airplaneMesh.scale.set(scale, scale, scale);
    }
  }

  // Getter para o mesh do avião
  getMesh() {
    return this.airplaneMesh;
  }

  // Função para debug - mostra informações do avião
  getInfo() {
    if (this.airplaneMesh) {
      console.log('=== INFORMAÇÕES DO AVIÃO ===');
      console.log('Posição:', this.airplaneMesh.position);
      console.log('Rotação:', this.airplaneMesh.rotation);
      console.log('Escala:', this.airplaneMesh.scale);
      
      // Calcula o bounding box
      const box = new THREE.Box3().setFromObject(this.airplaneMesh);
      console.log('Tamanho (bounding box):', box.getSize(new THREE.Vector3()));
    }
  }
}

export default Airplane;