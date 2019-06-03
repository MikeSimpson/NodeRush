class Sheep extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#ffebd2';
        this.eaten = false;
        if (game.gameRandom.nextFloat() < 0.5) {
            this.powerUp = Power_up.getRandomBurst();
        }
    }

    getColor() {
        if (this.eaten) {
            return '#ff8b72';
        }
        if (this.rooted) {
            return '#bfab92';
        }
        if (powerKey && this.powerUp != null && (game.players[0].pos.adjacent(this.pos) || (game.players.length > 1 && game.players[1].pos.adjacent(this.pos)))) {
            return this.powerUp.getColor();
        }
        return this.color;
    }
}
