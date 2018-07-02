let BOARD_WIDTH = 20
let BOARD_HEIGHT = 10
let LEVEL_LAPS = 5
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

        this.initialiseGame()
    }

    initialiseGame() {
        //configure seed
        let seed = parseInt(Math.random() * 2147483647)
        this.random = new Random(seed)

        this.directionIsRight = true

        this.score = 0
        $("h2").text("Score: " + this.score)
        this.updateBackgroundColours()

        //initialise board
        this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT)
        this.spawnBoulders()

        //initialise actors
        this.sheepCount = BOARD_HEIGHT - 1
        this.wolfCount = 1
        this.spawnActors();

        //clear debug flags
        this.teleport = false

        this.draw()
    }

    spawnActors() {
        let startX = this.directionIsRight ? 0 : BOARD_WIDTH - 1

        let playerY = parseInt(this.random.nextFloat() * BOARD_HEIGHT)
        this.player = new Player(new Pos(startX, playerY))
        this.board[startX][playerY] = this.player
        //spawn sheep
        this.sheeps = new Set()
        var sheepsCreated = 0

        while (this.sheepCount > 0) {
            //attempt to add a sheep
            let y = parseInt(this.random.nextFloat() * BOARD_HEIGHT)
            if (!(this.board[startX][y] instanceof Actor)) {
                let sheep = new Sheep(new Pos(startX, y))
                this.board[startX][y] = sheep
                this.sheeps.add(sheep)
                sheepsCreated++
                if (sheepsCreated === this.sheepCount) break
            }
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
        //update score
        this.score++
        $("h2").text("Score: " + this.score)
        //every ten laps, reset but up the tempo
        if (this.score % LEVEL_LAPS === 0) {
            this.updateBackgroundColours()
            this.wolfCount = parseInt(this.score / LEVEL_LAPS + 1)
            this.sheepCount = BOARD_HEIGHT - 1
            //reset board
            this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT)
            this.spawnBoulders()
        }

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
                    this.context.fillStyle = this.backgroundA
                } else {
                    this.context.fillStyle = this.backgroundB
                }
                this.context.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
            }
        }
    }

    update(dest, ctrl) {
        this.moveActor(this.player, dest, ctrl)
        game.updateAI()
        if (this.score / LEVEL_LAPS > 10) { //disco mode
            this.updateBackgroundColours()
        }
        this.draw()
    }

    moveActor(actor, dest, ctrl) {
        //remove actor if dest null
        if (dest === null) {
            //remove actor
            this.board[actor.pos.x][actor.pos.y] = null
            return
        }

        //deny moves more than one tile away
        if (!Pos.adjacent(actor.pos, dest) && !this.teleport) return

        let target

        if (actor instanceof Player) {
            //check for win condition
            let targetX = this.directionIsRight ? BOARD_WIDTH : -1 //these are offscreen x values as the player needs to actively move off the screen to win
            if (dest.x === targetX) {
                this.resetRound()
            }

            target = this.board[dest.x][dest.y]

            //check for player hitting, we assume they want to hit a wolf if they walk into it
            if (ctrl || target instanceof Wolf && !target.rooted) {
                if (target instanceof Actor) {
                    this.board[dest.x][dest.y].rooted = true
                }
                return
            }

            //check for player trying to push
            if (target instanceof Sheep) {
                this.moveActor(target, Pos.getPushPos(actor.pos, dest))
            }
        }

        //deny moves off screen or into obstruction
        if (dest.x < 0 || dest.x >= BOARD_WIDTH || dest.y < 0 || dest.y >= BOARD_HEIGHT
            || this.board[dest.x][dest.y] instanceof Actor) return

        //update board
        this.board[actor.pos.x][actor.pos.y] = null
        this.board[dest.x][dest.y] = actor

        //update actor
        actor.pos = dest
    }

    updateAI() {
        this.sheepAI()
        this.wolfAI()
    }

    sheepAI() {
        let graph = new Graph(this.getWeightArray(true));

        let sheepGoals = []
        let targetX = this.directionIsRight ? BOARD_WIDTH - 1 : 0
        for (var y = 0; y < BOARD_HEIGHT; y++) {
            sheepGoals.push(new Pos(targetX, y))
        }
        this.sheeps.forEach(sheep => {
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
    }

    wolfAI() {
        let graph = new Graph(this.getWeightArray());

        let wolfGoals = []
        wolfGoals.push(this.player.pos)
        this.sheeps.forEach(sheep => {
            if (!sheep.eaten) {
                wolfGoals.push(sheep.pos)
            }
        })

        var break_outer = false
        this.wolves.forEach(wolf => {
            if (break_outer) return
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
                    if (this.board[nextStep.x][nextStep.y] instanceof Player) {
                        addHighscore()
                        //Awkward loop breaking so that the next game doesn't have ghost wolves...
                        break_outer = true
                        return
                    }
                }
                this.moveActor(wolf, new Pos(nextStep.x, nextStep.y))
            }
        })
    }

    getWeightArray(sheep = false) {
        let array = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            array[x] = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.board[x][y] instanceof Actor && this.board[x][y].rooted) {
                    array[x][y] = 0
                } else {
                    array[x][y] = 1
                }
                if (sheep) {
                    this.wolves.forEach(wolf => {
                        if (wolf.rooted) return
                        if (Pos.adjacent(wolf.pos, new Pos(x, y))) {
                            array[x][y] = 0
                        }
                    })
                }
            }
        }
        return array;
    }

    updateBackgroundColours() {
        let level = parseInt(this.score / LEVEL_LAPS + 1)
        switch (level) {
            case 1:
                this.backgroundA = '#adff2f'
                this.backgroundB = '#9be52a'
                break
            case 2:
                this.backgroundA = '#e5e57d'
                this.backgroundB = '#ffff8b'
                break
            case 3:
                this.backgroundA = '#d7ffff'
                this.backgroundB = '#c1e5e5'
                break
            case 4:
                this.backgroundA = '#7e5426'
                this.backgroundB = '#8c673e'
                break
            case 5:
                this.backgroundA = '#00cccc'
                this.backgroundB = '#00b7b7'
                break
            case 6:
                this.backgroundA = '#dddddd'
                this.backgroundB = '#bbbbbb'
                break
            default:
                this.backgroundA = this.getRandomColor()
                this.backgroundB = this.getRandomColor()
        }
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(this.random.nextFloat() * 16)];
        }
        return color;
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

    static adjacent(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y) === 1
    }

    static getPushPos(pos1, pos2) {
        if (pos1.getRightPos().x === pos2.x) {
            return pos2.getRightPos()
        }
        if (pos1.getUpPos().y === pos2.y) {
            return pos2.getUpPos()
        }
        if (pos1.getLeftPos().x === pos2.x) {
            return pos2.getLeftPos()
        }
        if (pos1.getDownPos().y === pos2.y) {
            return pos2.getDownPos()
        }
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

//debug codes
function enableTeleport() {
    game.teleport = true
}

function eatAllTheSheep() {
    game.sheeps.forEach(sheep => {
        sheep.eaten = true;
        sheep.rooted = true;
        game.sheepCount--
        game.wolfCount++
    })
}

function addHighscore() {
    var person = prompt(
        'Congratulations, you lose! Enter your name to save your score:'
    );

    if (person != null) {
        $.post(
            '/highscore',
            {
                name: person,
                score: game.score
            },
            function(msg) {
                alert(msg);
            }
        );
    }
    this.initialiseGame()
}
