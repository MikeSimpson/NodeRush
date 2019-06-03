class Player extends Actor {
    constructor(pos, index) {
        super(pos);
        switch (index) {
            case 0:
                this.color = '#00BFFF';
                break;
            case 1:
                this.color = '#57E5BF';
                break;
        }
        this.powerUp = [];
    }

    getColor() {
        if (this.powerUp.length == 0 || this.powerUp[this.powerUp.length - 1].timer === 2 || this.powerUp[this.powerUp.length - 1].timer === 4) {
            return this.color;
        } else if (this.powerUp[this.powerUp.length - 1] instanceof Power_up) {
            return this.powerUp[this.powerUp.length - 1].getColor();
        }
    }
}
