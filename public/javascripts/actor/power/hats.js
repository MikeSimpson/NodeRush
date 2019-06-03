class MoneyBags extends Power_up {
    constructor() {
        super();
        this.color = '#888888';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}

class Undead extends Power_up {
    constructor() {
        super();
        this.color = '#888800';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 5;
    }
}
