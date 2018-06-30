let BOARD_WIDTH = 20
let BOARD_HEIGHT = 10
let BACKGROUND_A = '#adff2f';
let BACKGROUND_B = '#9be52a';
let game

$(document).ready(function () {
    game = new Game()

    //initialise key listeners
    window.addEventListener('keydown', keyListener, true)

    console.log('Starting game')

})

var keyListener = function (e) {
    //prevent browser scrolling
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault()
    }

    switch (e.keyCode) {
        case 37: //Left
            game.update(game.player.pos.getLeftPos())
            break
        case 38: //Up
            game.update(game.player.pos.getUpPos())
            break
        case 39: //Right
            game.update(game.player.pos.getRightPos())
            break
        case 40: //Down
            game.update(game.player.pos.getDownPos())
            break
        case 32: //Space
            game.update(game.player.pos)
            break
        default:
    }

    console.log(e.keyCode)
}

class Pos {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    getLeftPos() {
        return new Pos(Math.max(0, this.x - 1), this.y)
    }

    getRightPos() {
        return new Pos(this.x + 1, this.y)
    }

    getUpPos() {
        return new Pos(this.x, Math.max(0, this.y - 1))
    }

    getDownPos() {
        return new Pos(this.x, this.y + 1)
    }
}

class Actor {
    constructor(pos) {
        this.pos = pos
        this.color = '#ff00ff'
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#00BFFF'
    }
}

class Sheep extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#ffebd2'
    }
}

class Wolf extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#ff0000'
    }
}

class Boulder extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#696969'
    }
}

class Game {


    constructor() {
        //initialise canvas
        let div = document.getElementById('canvas_container')
        let canvas = document.createElement('canvas')
        canvas.id = 'bullrush_canvas'
        this.tileSize = parseInt(div.offsetWidth / BOARD_WIDTH)
        canvas.width = this.tileSize * BOARD_WIDTH
        canvas.height = this.tileSize * BOARD_HEIGHT
        div.appendChild(canvas)
        this.context = canvas.getContext('2d')

        //configure seed
        let seed = parseInt(Math.random() * 2147483647);
        this.random = new Random(seed);

        this.board = this.createBoard(BOARD_WIDTH, BOARD_HEIGHT)
        this.spawnBoulders()

        //initialise actors
        this.sheeps = new Set()
        this.wolves = new Set()
        this.player = new Player(new Pos(0, 0))
        this.board[0][0] = this.player

        for (var y = 1; y < BOARD_HEIGHT; y++) {
            let sheep = new Sheep(new Pos(0, y))
            this.board[0][y] = sheep
            this.sheeps.add(sheep)
        }

        while (true) {
            let x = parseInt(BOARD_WIDTH / 2 + this.random.nextFloat() * BOARD_WIDTH / 2)
            let y = parseInt(this.random.nextFloat() * BOARD_HEIGHT)
            if (!(this.board[x][y] instanceof Boulder)) {
                let alphaWolf = new Wolf(new Pos(x, y))
                this.board[x][y] = alphaWolf
                this.wolves.add(alphaWolf)
                break
            }
        }

        this.draw()
    }

    draw() {
        // this.context.scale(this.tileSize, this.tileSize)
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
        //draw player
        //draw all tiles
        for (var x = 0; x < BOARD_WIDTH; x++) {
            for (var y = 0; y < BOARD_HEIGHT; y++) {
                if (this.board[x][y] instanceof Actor) {
                    this.context.fillStyle = this.board[x][y].color
                } else if ((x % 2 == 0 && y % 2 != 0) || (x % 2 != 0 && y % 2 == 0)) {
                    this.context.fillStyle = BACKGROUND_A
                } else {
                    this.context.fillStyle = BACKGROUND_B
                }
                this.context.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
            }
        }
    }

    update(dest) {
        this.moveActor(this.player, dest)
        game.updateAI()
        this.draw()
    }

    moveActor(actor, dest) {
        //check valid move
        //TODO most advanced sheep moves first
        let targetTile = this.board[dest.x][dest.y]

        //deny moves off screen or into obstruction
        if (dest.x < 0 || dest.x >= BOARD_WIDTH || dest.y < 0 || dest.y >= BOARD_HEIGHT
            || targetTile instanceof Boulder || targetTile instanceof Sheep) return

        //update board
        this.board[actor.pos.x][actor.pos.y] = null
        this.board[dest.x][dest.y] = actor

        //update actor
        actor.pos = dest
    }

    updateAI() {
        var graph = new Graph(this.getWeightArray());

        this.sheeps.forEach(sheep => {
            var start = graph.grid[sheep.pos.x][sheep.pos.y]
            var end = graph.grid[BOARD_WIDTH - 1][0]
            var nextStep = astar.search(graph, start, end).shift();
            if (typeof nextStep !== 'undefined') {
                this.moveActor(sheep, new Pos(nextStep.x, nextStep.y))
            }
        })
        this.wolves.forEach(wolf => {

        })
    }

    createBoard(width, height) {
        let board = []
        for (var i = 0; i < width; i++) {
            board.push([0])
            for (var j = 0; j < height; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }

    spawnBoulders() {
        console.log(this.random.nextFloat())
        //loop every non edge tile and chuck a maybe boulder in it
        for (var x = 1; x < BOARD_WIDTH - 1; x++) {
            for (var y = 0; y < BOARD_HEIGHT; y++) {
                console.log(this.random.nextFloat())
                if (this.random.nextFloat() < 0.2) {
                    this.board[x][y] = new Boulder(new Pos([x][y]))
                }
            }
        }
    }

    getWeightArray() {
        let array = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            array[x] = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.board[x][y] instanceof Actor) {
                    array[x][y] = 0
                } else {
                    array[x][y] = 1
                }
            }
        }
        return array;
    }
}

