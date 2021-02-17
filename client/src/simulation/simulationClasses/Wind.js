// Image imports
import speed0 from '../../assets/wind-symbols/0kmu.png';
import speed9 from '../../assets/wind-symbols/9kmu.png';
import speed19 from '../../assets/wind-symbols/19kmu.png';
import speed28 from '../../assets/wind-symbols/28kmu.png';
import speed37 from '../../assets/wind-symbols/37kmu.png';
import speed46 from '../../assets/wind-symbols/46kmu.png';
import speed56 from '../../assets/wind-symbols/56kmu.png';
import speed65 from '../../assets/wind-symbols/65kmu.png';
import speed74 from '../../assets/wind-symbols/74kmu.png';
import speed83 from '../../assets/wind-symbols/83kmu.png';
import speed93 from '../../assets/wind-symbols/93kmu.png';
import speed102 from '../../assets/wind-symbols/102kmu.png';
import speed111 from '../../assets/wind-symbols/111kmu.png';
import speed120 from '../../assets/wind-symbols/120kmu.png';
import speed185 from '../../assets/wind-symbols/185kmu.png';
import speed194 from '../../assets/wind-symbols/194kmu.png';

export default class Wind {
    constructor( simCtx, direction, speedInMPerS ) {
        this.simCtx = simCtx;
        this.direction = direction;
        this.speedInMPerS = speedInMPerS;

        this.posXOnCanvas = 10;
        this.posYOnCanvas = 10;
        this.width = 60;
        this.height = 60;

        this.speedBorderValues = [ {value:0, src: speed0}, {value:9, src: speed9}, {value:19, src: speed19}, {value:28, src: speed28}, {value:37, src: speed37}, {value:46, src: speed46}, {value:56, src: speed56}, {value:65, src: speed65}, {value:74, src: speed74}, {value:83, src: speed83}, {value:93, src: speed93}, {value:102, src: speed102}, {value:111, src: speed111}, {value:120, src: speed120}, {value:185, src: speed185}, {value:194, src: speed194} ];
        this.symbol = new Image();

        // Select correct symbol
        let speedBorderValuesIndex = 0;
        const lastValue = this.speedBorderValues[this.speedBorderValues.length-1]
        if (lastValue < this.speedInMPerS) {
            this.symbol.src = eval('speed'+lastValue);
        }
        while (!this.symbol.src) {
            const value = this.speedBorderValues[speedBorderValuesIndex].value;
            const src = this.speedBorderValues[speedBorderValuesIndex].src;
            if (value < this.speedInMPerS && this.speedInMPerS < this.speedBorderValues[speedBorderValuesIndex+1].value) {
                this.symbol.src = src;
            } else if ( speedBorderValuesIndex >= this.speedBorderValues.length-1 ) {
                this.symbol.src = speed0;
            }
            speedBorderValuesIndex += 1; 
        }
    }

    /**
     * Laadt het symbool in
     */
    async loadImage() {
        return new Promise((resolve, reject) => {
            this.symbol.onload = function(){
                console.log('Wind-symbol has been loaded');
                resolve();
            }.bind(this);
        });
    }

    /**
     * Tekent het wind symbool op het canvas
     * @param {*} ctx een canvas-context
     */
    draw(ctx=this.simCtx.ctx) {

        // context opslaan in voorbereiding van de context transformatie
        ctx.save();

        // translate van context naar midden van de afbeelding
        ctx.translate(this.posXOnCanvas+this.width/2, this.posYOnCanvas+this.height/2);

        // roteer de context naar de hoek van het schip
        ctx.rotate((this.direction * -1)*Math.PI/180);

        // afbeelding op canvas tekenen
        ctx.drawImage(this.symbol, this.width/-2, this.height/-2, this.width, this.height);

        // restore context
        ctx.restore();

    }

    setDirection(directionInDegrees) {
        this.direction = directionInDegrees;
    }
}