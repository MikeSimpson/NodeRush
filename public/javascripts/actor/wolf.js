class Wolf extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#ff0000';
        this.flanker = game.gameRandom.nextFloat() < 0.2;
    }

    getColor() {
        if (this.rooted) {
            return '#990000';
        }
        return this.color;
    }
}
