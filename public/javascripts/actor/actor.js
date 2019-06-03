class Actor {
    constructor(pos) {
        this.pos = pos;
        this.color = '#000000';
        this.rooted = false;
        this.plan = null;
    }

    getColor() {
        return this.color;
    }
}
