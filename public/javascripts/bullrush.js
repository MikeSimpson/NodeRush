let TILE_SIZE = 70
let game;

$(document).ready(function () {
    game = new Game()

    //initialise key listeners
    window.addEventListener('keydown', keyListener, true)

    console.log("Starting game")

})

var keyListener = function (e) {
    //prevent browser scrolling
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault()
    }
    game.updatePlayer(e.keyCode)

    console.log(e.keyCode)
};

class Pos {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

class Actor {
    constructor(pos) {
        this.pos = pos
        this.color = "#ff00ff"
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos);
        this.color = "#00ffff"
    }
}

class Sheep extends Actor {
    constructor(pos) {
        super(pos);
        this.color = "#ffffff"
    }
}

class Wolf extends Actor {
    constructor(pos) {
        super(pos);
        this.color = "#ff0000"
    }
}

class Game {

    constructor() {
        //initialise canvas
        let div = document.getElementById('canvascontainer')
        let canvas = document.createElement('canvas')
        canvas.id = 'myCanvas'
        canvas.width = TILE_SIZE * 20
        canvas.height = TILE_SIZE * 10
        div.appendChild(canvas)
        this.context = canvas.getContext('2d')

        this.player = new Player(new Pos(0, 0), this);
        this.draw()
    }

    draw() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
        //draw border
        this.context.fillStyle = "#55aa55"
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height)
        //draw player
        this.context.fillStyle = this.player.color
        this.context.fillRect(this.player.pos.x, this.player.pos.y, TILE_SIZE, TILE_SIZE)
    }

    updatePlayer(input) {
        switch (input) {
            case 37: //Left
                this.player.pos.x -= TILE_SIZE
                this.updateAI()
                break;
            case 38: //Up
                this.player.pos.y -= TILE_SIZE
                this.updateAI()
                break;
            case 39: //Right
                this.player.pos.x += TILE_SIZE
                this.updateAI()
                break;
            case 40: //Down
                this.player.pos.y += TILE_SIZE
                this.updateAI()
                break;
            case 32: //Space
                this.updateAI()
                break;
            default:
        }
        this.draw()
    }

    updateAI() {

    }
}

