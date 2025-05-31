class Ramp{
    constructor(){
        //Vetor com todas as rampas para verificação no getRamp
        this.rampas = [
        { baseX: -16, topoX: 16, baseZ: 55, topoZ: 70, altura: 10 },
        { baseX: -188, topoX: -172, baseZ: -73, topoZ: -61, altura: 10 },
        { baseX: -8, topoX: 8, baseZ: -73, topoZ: -61, altura: 8 },
        { baseX: 172, topoX: 188, baseZ: -73, topoZ: -61, altura: 10 },
        ];
    }
    
    //Função que calcula a altura da rampa baseada na fórmula e na posição
    getRampHeight(x,y, z) {
        //Verifica se está no topo das áreas
        if((z>=55 && z<=187 && x<=156 && x>=-156 && y!=2) || ((z<-64 && z>-179 && y !=2) && ((x>-218 && x<-94) || (x>-62 && x<62) || (x>94 && x<218))))
            return 8;
        //Se não tá no topo vê se tá dentro da área de rampa e assim calcula seu y
        for (const rampa of this.rampas) {
            const dentroZ = z >= rampa.baseZ && z <= rampa.topoZ;
            const dentroX = x >= Math.min(rampa.baseX, rampa.topoX) && x <= Math.max(rampa.baseX, rampa.topoX);
            
            if (dentroZ && dentroX) {
            const comprimentoRampa = Math.sqrt(
                Math.pow(rampa.topoX - rampa.baseX, 2) + 
                Math.pow(rampa.topoZ - rampa.baseZ, 2)
            );
            
            const distanciaAtual = Math.sqrt(
                Math.pow(x - rampa.baseX, 2) + 
                Math.pow(z - rampa.baseZ, 2)
            );
            
            // Limita o valor entre 0 e 1
            const t = Math.min(1, Math.max(0, distanciaAtual / comprimentoRampa));
            
            // Aplica easing para suavizar a transição
            const easedT = this.easeInOutQuad(t);
            return 1 + (easedT * rampa.altura);
            }
        }

        return 2; // altura padrão do cubo
    }

    //Função para suavizar subida na ramap
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}

export default Ramp;