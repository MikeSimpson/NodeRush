class MoneyBags extends PowerUp {
    constructor() {
        super();
        this.color = '#888888';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}

class Undead extends PowerUp {
    constructor() {
        super();
        this.color = '#888800';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}

class SemiSpeed extends PowerUp {
    constructor() {
        super();
        this.color = '#ffffc8';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}

class Psychic extends PowerUp {
    constructor() {
        super();
        this.color = '#ffa2ff';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}
