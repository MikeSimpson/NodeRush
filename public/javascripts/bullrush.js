let BOARD_WIDTH = 20
let BOARD_HEIGHT = 10
let BACKGROUND_A = '#adff2f';
let BACKGROUND_B = '#9be52a';
let game

$(document).ready(function () {
    game = new Game()

    window.addEventListener('keydown', keyListener, true)
    window.addEventListener('click', clickListener, true)
})

let keyListener = function (e) {
    //prevent browser scrolling
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control'].indexOf(e.key) > -1) {
        e.preventDefault()
    }

    switch (e.key) {
        case 'ArrowLeft':
            game.update(game.player.pos.getLeftPos(), e.ctrlKey || e.altKey)
            break
        case 'ArrowUp':
            game.update(game.player.pos.getUpPos(), e.ctrlKey || e.altKey)
            break
        case 'ArrowRight':
            game.update(game.player.pos.getRightPos(), e.ctrlKey || e.altKey)
            break
        case 'ArrowDown':
            game.update(game.player.pos.getDownPos(), e.ctrlKey || e.altKey)
            break
        case ' ':
            game.update(game.player.pos, e.ctrlKey || e.altKey)
            break
        default:
    }
}

let clickListener = function (e) {
    game.update(Pos.getPosFromClick(e, game))
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
        let seed = parseInt(Math.random() * 2147483647)
        this.random = new Random(seed)

        this.initialiseGame()
    }

    initialiseGame() {
        this.directionIsRight = true

        //initialise board
        this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT)
        this.spawnBoulders()

        //initialise actors
        this.sheepCount = BOARD_HEIGHT - 1
        this.wolfCount = 1
        this.spawnActors();

        this.draw()
    }

    spawnActors() {
        let startX = this.directionIsRight ? 0 : BOARD_WIDTH - 1

        this.player = new Player(new Pos(startX, 0))
        this.board[startX][0] = this.player

        //spawn sheep
        this.sheeps = new Set()
        for (var y = 1; y <= this.sheepCount; y++) {
            let sheep = new Sheep(new Pos(startX, y))
            this.board[startX][y] = sheep
            this.sheeps.add(sheep)
        }

        //spawn wolves
        this.wolves = new Set()
        var wolvesCreated = 0
        while (true) {
            //attempt to add a wolf
            let x = parseInt(this.random.nextFloat() * BOARD_WIDTH / 2)
            //force wolf to second half of board
            if (this.directionIsRight) x += parseInt(BOARD_WIDTH / 2)
            let y = parseInt(this.random.nextFloat() * BOARD_HEIGHT)
            if (!(this.board[x][y] instanceof Boulder)) {
                let wolf = new Wolf(new Pos(x, y))
                this.board[x][y] = wolf
                this.wolves.add(wolf)
                wolvesCreated++
                if (wolvesCreated === this.wolfCount) break
            }
        }
    }

    spawnBoulders() {
        //loop every non edge tile and chuck a maybe boulder in it
        for (var x = 1; x < BOARD_WIDTH - 1; x++) {
            for (var y = 0; y < BOARD_HEIGHT; y++) {
                if (this.random.nextFloat() < 0.2) {
                    this.board[x][y] = new Boulder(new Pos([x][y]))
                }
            }
        }
    }

    resetRound() {
        //reverse direction
        this.directionIsRight = !this.directionIsRight

        //reset actors
        this.moveActor(this.player, null)
        this.sheeps.forEach(sheep => {
            this.moveActor(sheep, null)
        })
        this.wolves.forEach(wolf => {
            this.moveActor(wolf, null)
        })
        this.sheeps = new Set()
        this.wolves = new Set()
        this.spawnActors();

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
                    this.context.fillStyle = this.board[x][y].getColor()
                } else if ((x % 2 == 0 && y % 2 != 0) || (x % 2 != 0 && y % 2 == 0)) {
                    this.context.fillStyle = BACKGROUND_A
                } else {
                    this.context.fillStyle = BACKGROUND_B
                }
                this.context.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
            }
        }
    }

    update(dest, ctrl) {
        this.moveActor(this.player, dest, ctrl)
        game.updateAI()
        this.draw()
    }

    moveActor(actor, dest, ctrl) {
        //remove actor if dest null
        if (dest === null) {
            //remove actor
            this.board[actor.pos.x][actor.pos.y] = null
            return
        }

        //check for win condition
        let targetX = this.directionIsRight ? BOARD_WIDTH : -1 //these are offscreen x values as the player needs to actively move off the screen to win
        if (actor instanceof Player && dest.x === targetX) {
            this.resetRound()
        }

        //check for player hitting
        if (ctrl) {
            if (this.board[dest.x][dest.y] instanceof Actor) {
                this.board[dest.x][dest.y].rooted = true
            }
            return
        }

        //check valid move
        //TODO most advanced sheep moves first
        let targetTile = this.board[dest.x][dest.y]

        //deny moves off screen or into obstruction
        if (dest.x < 0 || dest.x >= BOARD_WIDTH || dest.y < 0 || dest.y >= BOARD_HEIGHT
            || targetTile instanceof Actor) return

        //deny moves more than one tile away
        if (Math.abs(actor.pos.x - dest.x) + Math.abs(actor.pos.y - dest.y) > 1) return

        //update board
        this.board[actor.pos.x][actor.pos.y] = null
        this.board[dest.x][dest.y] = actor

        //update actor
        actor.pos = dest
    }

    updateAI() {
        var graph = new Graph(this.getWeightArray());

        let sheepGoals = []
        let wolfGoals = []
        wolfGoals.push(this.player.pos)
        let targetX = this.directionIsRight ? BOARD_WIDTH - 1 : 0
        for (var y = 0; y < BOARD_HEIGHT; y++) {
            sheepGoals.push(new Pos(targetX, y))
        }
        this.sheeps.forEach(sheep => {
            if (!sheep.eaten) {
                wolfGoals.push(sheep.pos)
            }
            if (sheep.rooted) return
            if (sheep.pos.x === targetX) {
                this.moveActor(sheep, null)
                this.sheeps.delete(sheep) //seems dangerous to do this here ¯\_(ツ)_/¯
                return
            }
            let start = graph.grid[sheep.pos.x][sheep.pos.y]
            let endPos = Game.nearestGoal(sheep.pos, sheepGoals)
            let end = graph.grid[endPos.x][endPos.y]
            let nextStep = astar.search(graph, start, end).shift();
            if (typeof nextStep !== 'undefined') {
                this.moveActor(sheep, new Pos(nextStep.x, nextStep.y))
            }
        })

        this.wolves.forEach(wolf => {
            if (wolf.rooted) return
            let start = graph.grid[wolf.pos.x][wolf.pos.y]
            let endPos = Game.nearestGoal(wolf.pos, wolfGoals)
            let end = graph.grid[endPos.x][endPos.y]
            let nextStep = astar.search(graph, start, end).shift();
            if (typeof nextStep !== 'undefined') {
                if (Math.abs(wolf.pos.x - nextStep.x) + Math.abs(wolf.pos.y - nextStep.y) === 1) {
                    //attack the target
                    if (this.board[nextStep.x][nextStep.y] instanceof Sheep) {
                        this.board[nextStep.x][nextStep.y].rooted = true
                        this.board[nextStep.x][nextStep.y].eaten = true
                        this.sheepCount--
                        this.wolfCount++
                    }
                }
                this.moveActor(wolf, new Pos(nextStep.x, nextStep.y))
            }
        })
    }

    getWeightArray() {
        let array = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            array[x] = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.board[x][y] instanceof Actor && this.board[x][y].rooted) {
                    array[x][y] = 0
                } else {
                    array[x][y] = 1
                }
            }
        }
        return array;
    }

    static createBoard(width, height) {
        let board = []
        for (var i = 0; i < width; i++) {
            board.push([])
            for (var j = 0; j < height; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }

    static nearestGoal(start, goals) {
        var minHatten = 1993 //my birthyear
        var goal
        for (var i = 0; i < goals.length; i++) {
            let distance = astar.heuristics.manhattan(start, goals[i]) //warning, we are using Pos instead of GridNode but I guess it still works #javascript
            if (distance <= minHatten) {
                minHatten = distance
                goal = goals[i]
            }
        }
        return goal
    }
}

class Pos {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    getLeftPos() {
        return new Pos(this.x - 1, this.y)
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

    static getPosFromClick(e, game) {
        let x = parseInt((e.x - game.context.canvas.offsetLeft) / game.tileSize)
        let y = parseInt((e.y - game.context.canvas.offsetLeft) / game.tileSize)
        return new Pos(x, y)
    }
}

class Actor {
    constructor(pos) {
        this.pos = pos
        this.color = '#ff00ff'
        this.rooted = false
    }

    getColor() {
        return this.color
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
        this.eaten = false
    }

    getColor() {
        if (this.eaten) {
            return '#ff8b72'
        }
        if (this.rooted) {
            return '#bfab92'
        }
        return this.color
    }
}

class Wolf extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#ff0000'
    }

    getColor() {
        if (this.rooted) {
            return '#990000'
        }
        return this.color
    }
}

class Boulder extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#696969'
        this.rooted = true
    }
}

