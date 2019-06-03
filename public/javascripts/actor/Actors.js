class Decoy extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#77BFFF';
        this.eaten = false;
    }

    getColor() {
        if (this.eaten) {
            return '#ff8b72';
        }
        return this.color;
    }

}

class Boulder extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#696969';
        this.rooted = true;
    }
}

class Coin extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#ffcc00';
        this.rooted = true;
    }
}

class Crate extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#bb9955';
        this.rooted = true;
    }
}

class Clone extends Actor {
    constructor(pos) {
        super(pos);
        this.color = '#55CFFF';
        this.powerUp = [];
    }
}
