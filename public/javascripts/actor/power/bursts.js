class SuperPush extends Power_up {
    constructor() {
        super();
        this.color = '#996655';
    }
}

class WolfDisguise extends Power_up {
    constructor() {
        super();
        this.color = '#ff0099';
        this.decoyCount = 1;
    }
}

class SuperSpeed extends Power_up {
    constructor() {
        super();
        this.color = '#ffff88';
    }

    static get WEIGHT() {
        return 5;
    }
}

class LethalBlows extends Power_up {
    constructor() {
        super();
        this.color = '#000000';
        this.timer = 6;
    }

    static get WEIGHT() {
        return 5;
    }
}

class CoinSurprise extends Power_up { //spawns coins and gives 2x multiplier
    constructor() {
        super();
        this.color = '#00BFFF';
        this.timer = 1;
    }

    static get WEIGHT() {
        return 0;
    }
}

class ChainLightning extends Power_up {
    constructor() {
        super();
        this.color = '#eeeeff';
    }

    static get WEIGHT() {
        return 0;
    }
}

class Rescue extends Power_up {
    constructor() {
        super();
        this.color = '#eeeeff';
        this.timer = 9999;
    }

    static get WEIGHT() {
        return 0;
    }
}

class Cloned extends Power_up {
    constructor() {
        super();
        this.color = '#88eeaa';
        this.timer = 10;
    }

    static get WEIGHT() {
        return 10;
    }
}
