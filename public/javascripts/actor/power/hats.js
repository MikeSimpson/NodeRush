class MoneyBags extends PowerUp {
    constructor() {
        super();
        this.color = '#888888';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 4;
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
        this.color = '#bb00ff';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}

class Medic extends PowerUp {
    constructor() {
        super();
        this.color = '#ffb5d5';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 3;
    }
}

class Looter extends PowerUp {
    constructor() {
        super();
        this.color = '#f5f100';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 3;
    }
}