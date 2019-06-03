class PowerUp extends Actor {
    constructor() {
        super(new Pos(-1, -1));
        this.color = '#000000';
        this.timer = 30;
        this.rooted = true
    }

    static get WEIGHT() {
        return 10
    }

    getColor() {
        return this.color
    }

    static getRandomHat() {
        let totalWeight = MoneyBags.WEIGHT
            + Undead.WEIGHT
            + SemiSpeed.WEIGHT
            + Psychic.WEIGHT;
        var pill = 0;
        let rand = game.gameRandom.nextFloat() * totalWeight;
        if (rand < (MoneyBags.WEIGHT + pill)) return new MoneyBags();
        pill += MoneyBags.WEIGHT;
        if (rand < (Undead.WEIGHT + pill)) return new Undead();
        pill += Undead.WEIGHT;
        if (rand < (SemiSpeed.WEIGHT + pill)) return new SemiSpeed();
        pill += SemiSpeed.WEIGHT;
        if (rand < (Psychic.WEIGHT + pill)) return new Psychic();
        pill += Psychic.WEIGHT;
        return new Undead()
    }

    static getRandomBurst() {
        let totalWeight = SuperPush.WEIGHT
            + WolfDisguise.WEIGHT
            + LethalBlows.WEIGHT
            + SuperSpeed.WEIGHT
            + CoinSurprise.WEIGHT
            + ChainLightning.WEIGHT
            + Rescue.WEIGHT
            + Cloned.WEIGHT;
        var pill = 0;
        let rand = game.gameRandom.nextFloat() * totalWeight;
        // console.log(totalWeight)
        // console.log(pill)
        // console.log(rand)
        if (rand < (SuperPush.WEIGHT + pill)) return new SuperPush();
        pill += SuperPush.WEIGHT;
        if (rand < (WolfDisguise.WEIGHT + pill)) return new WolfDisguise();
        pill += WolfDisguise.WEIGHT;
        if (rand < (LethalBlows.WEIGHT + pill)) return new LethalBlows();
        pill += LethalBlows.WEIGHT;
        if (rand < (SuperSpeed.WEIGHT + pill)) return new SuperSpeed();
        pill += SuperSpeed.WEIGHT;
        if (rand < (CoinSurprise.WEIGHT + pill)) return new CoinSurprise();
        pill += CoinSurprise.WEIGHT;
        if (rand < (ChainLightning.WEIGHT + pill)) return new ChainLightning();
        pill += ChainLightning.WEIGHT;
        if (rand < (Rescue.WEIGHT + pill)) return new Rescue();
        pill += Rescue.WEIGHT;
        if (rand < (Cloned.WEIGHT + pill)) return new Cloned();
        pill += Cloned.WEIGHT;
        return new SuperPush()
    }
}
