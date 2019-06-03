class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    getLeftPos() {
        return new Pos(this.x - 1, this.y);
    }

    getRightPos() {
        return new Pos(this.x + 1, this.y);
    }

    getUpPos() {
        return new Pos(this.x, Math.max(0, this.y - 1));
    }

    getDownPos() {
        return new Pos(this.x, this.y + 1);
    }

    static getPosFromClick(e, game) {
        let x = parseInt((e.x - game.context.canvas.offsetLeft) / game.tileSize);
        let y = parseInt((e.y - game.context.canvas.offsetTop) / game.tileSize);
        return new Pos(x, y);
    }

    adjacent(pos2) {
        return Math.abs(this.x - pos2.x) + Math.abs(this.y - pos2.y) === 1;
    }

    getPushPos(pos2) {
        //note left and right must become before up other wise you can't push when y == 0 because of the -1 checking
        if (this.getLeftPos().x === pos2.x) {
            return pos2.getLeftPos();
        }
        if (this.getRightPos().x === pos2.x) {
            return pos2.getRightPos();
        }
        if (this.getUpPos().y === pos2.y) {
            return pos2.getUpPos();
        }
        if (this.getDownPos().y === pos2.y) {
            return pos2.getDownPos();
        }
    }
}
