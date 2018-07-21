let BOARD_WIDTH = 20
let BOARD_HEIGHT = 10
let LEVEL_LAPS = 6
let MOVE_DELAY = 10
let ANIMATION_FRAMES = 10
let game
var sheepImage = new Image()
var wolfImage = new Image()
var playerImage = new Image()
sheepImage.src = '/sprites/sheep.png'
wolfImage.src = '/sprites/wolf.png'
playerImage.src = '/sprites/player.png'
var powerKey
var DIR = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4,
    WAIT: 5
};

$(document).ready(function () {
    game = new Game()
    game.initialiseGame()

    window.addEventListener('keydown', keyDownListener, true)

    window.addEventListener('keyup', keyUpListener, true)
    // window.addEventListener('click', clickListener, true)
})

let keyDownListener = function (e) {
    //prevent browser scrolling
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control'].indexOf(e.key) > -1) {
        e.preventDefault()
    }
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            game.update(DIR.LEFT, powerKey, e.key)
            break
        case 'ArrowUp':
        case 'w':
        case 'W':
            game.update(DIR.UP, powerKey, e.key)
            break
        case 'ArrowRight':
        case 'd':
        case 'D':
            game.update(DIR.RIGHT, powerKey, e.key)
            break
        case 'ArrowDown':
        case 's':
        case 'S':
            game.update(DIR.DOWN, powerKey, e.key)
            break
        case 'e':
        case ' ':
            game.update(DIR.WAIT, false, e.key)
            break
        case 'q':
        case 'Shift':
            powerKey = true
            game.draw()
            break
        default:
    }
}

let keyUpListener = function (e) {
    //prevent browser scrolling
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control'].indexOf(e.key) > -1) {
        e.preventDefault()
    }
    switch (e.key) {
        case 'q':
        case 'Shift':
            powerKey = false
            game.draw()
            break
        default:
    }
}

function dpadInput(key) {
    switch (key) {
        case 'PadLeft':
            game.update(game.player.pos.getLeftPos(), powerKey, key)
            powerKey = false
            break
        case 'PadUp':
            game.update(DIR.UP, powerKey, key)
            powerKey = false
            break
        case 'PadRight':
            game.update(DIR.RIGHT, powerKey, key)
            powerKey = false
            break
        case 'PadDown':
            game.update(DIR.DOWN, powerKey, key)
            powerKey = false
            break
        case 'PadWait':
            game.update(DIR.WAIT, powerKey, key)
            powerKey = false
            break
        case 'PadAttack':
            powerKey = true
            game.draw()
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
    }

    initialiseGame(seed) {
        //configure seed
        this.seed = seed || document.getElementById('seed').value
        if (this.seed === "" || (this.seed === this.lastSeed && seed === null)) {
            this.seed = parseInt(Math.random() * 2147483647);
            // document.getElementById('seed').value = seed;
        }

        this.lastSeed = this.seed;
        this.genRandom = new Random(this.seed)
        this.gameRandom = new Random(this.genRandom.next())

        this.directionIsRight = true

        this.laps = 0
        this.score = 0
        document.getElementById('score').innerText = "Score: " + this.score
        document.getElementById('lap').innerText = "Lap: " + (this.laps + 1)
        this.updateBackgroundColours()

        //initialise board
        this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT)
        this.spawnBoulders()

        //initialise actors
        this.sheepCount = BOARD_HEIGHT - 1 //zzzzzz
        this.wolfCount = 1
        this.player = new Player(new Pos(-1, -1)) //pos will be overidden
        this.spawnActors()

        //clear debug flags
        this.teleport = false

        this.inputLock = false //used to lock input while delayed loops are running

        this.moves = []

        this.draw()
    }

    spawnActors() {
        let startX = this.directionIsRight ? 0 : BOARD_WIDTH - 1

        //spawn player
        let playerY = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT)
        this.player.pos = new Pos(startX, playerY)
        this.board[startX][playerY] = this.player

        //spawn sheep
        this.sheeps = []
        var sheepsCreated = 0
        while (this.sheepCount > 0) {
            //attempt to add a sheep
            let y = parseInt(this.gameRandom.nextFloat() * BOARD_HEIGHT)
            if (!(this.board[startX][y] instanceof Actor)) {
                let sheep = new Sheep(new Pos(startX, y))
                this.board[startX][y] = sheep
                this.sheeps.push(sheep)
                sheepsCreated++
                if (sheepsCreated === this.sheepCount) break
            }
        }

        //spawn wolves
        this.wolves = []
        var wolvesCreated = 0
        while (this.wolfCount > 0) {
            //attempt to add a wolf
            let x = parseInt(this.gameRandom.nextFloat() * BOARD_WIDTH / 2)
            //force wolf to second half of board
            if (this.directionIsRight) x += parseInt(BOARD_WIDTH / 2)
            let y = parseInt(this.gameRandom.nextFloat() * BOARD_HEIGHT)
            if (!(this.board[x][y] instanceof Actor)) {
                let wolf = new Wolf(new Pos(x, y))
                this.board[x][y] = wolf
                this.wolves.push(wolf)
                wolvesCreated++
                if (wolvesCreated === this.wolfCount) break
            }
        }

        //spawn coin
        this.coins = []
        while (true) {
            //attempt to add a coin
            let x = parseInt(this.genRandom.nextFloat() * BOARD_WIDTH)
            //force wolf to second half of board
            let y = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT)
            if (!(this.board[x][y] instanceof Actor)) {
                let coin = new Coin(new Pos(x, y))
                this.board[x][y] = coin
                this.coins.push(coin)
                break
            }
        }

        //clear transient actors
        this.clones = []
        this.decoys = []
    }

    spawnBoulders() {
        this.boulders = []
        //loop every non edge tile and chuck a maybe boulder in it
        for (var x = 1; x < BOARD_WIDTH - 1; x++) {
            for (var y = 0; y < BOARD_HEIGHT; y++) {
                if (this.genRandom.nextFloat() < 0.2) {
                    let boulder = new Boulder(new Pos(x, y))
                    this.board[x][y] = boulder
                    this.boulders.push(boulder)
                }
            }
        }
    }

    resetRound() {
        //update laps
        this.laps++
        this.score++
        document.getElementById('score').innerText = "Score: " + this.score
        document.getElementById('lap').innerText = "Lap: " + (this.laps + 1)
        //every x laps, reset but up the tempo
        if (this.laps % LEVEL_LAPS === 0) {
            this.updateBackgroundColours()
            this.wolfCount = parseInt(this.laps / LEVEL_LAPS + 1)
            this.sheepCount = BOARD_HEIGHT - 1
            //reset board
            this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT)
            this.spawnBoulders()
            //TODO mutate boulders?
        }

        //reverse direction
        this.directionIsRight = !this.directionIsRight

        //reset actors
        this.moveActor(this.player, null)
        for (var i = 0; i < this.sheeps.length; i++) {
            this.moveActor(this.sheeps[i], null)
        }
        for (var i = 0; i < this.wolves.length; i++) {
            this.moveActor(this.wolves[i], null)
        }
        for (var i = 0; i < this.coins.length; i++) {
            this.moveActor(this.coins[i], null)
        }
        for (var i = 0; i < this.decoys.length; i++) {
            this.moveActor(this.decoys[i], null)
        }
        for (var i = 0; i < this.clones.length; i++) {
            this.moveActor(this.clones[i], null)
        }
        this.spawnActors();

        this.draw()
    }

    draw() {
        // this.context.scale(this.tileSize, this.tileSize)
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
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
                //draw sprites
                // if (this.board[x][y] instanceof Player) {
                //     this.context.drawImage(playerImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                //     continue
                // }
                // if (this.board[x][y] instanceof Wolf) {
                //     this.context.drawImage(wolfImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                //     continue
                // }
                // if (this.board[x][y] instanceof Sheep || this.board[x][y] instanceof Decoy) {
                //     this.context.drawImage(sheepImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                //     continue
                // }
            }
        }
    }

    update(dir, ctrl, key) {
        let playerDest
        switch (dir) {
            case DIR.UP:
                playerDest = this.player.pos.getUpPos()
                break;
            case DIR.DOWN:
                playerDest = this.player.pos.getDownPos()
                break;
            case DIR.LEFT:
                playerDest = this.player.pos.getLeftPos()
                break;
            case DIR.RIGHT:
                playerDest = this.player.pos.getRightPos()
                break;
            case DIR.WAIT:
                playerDest = this.player.pos
                break;
        }
        if (this.inputLock) return
        if (ctrl) {
            game.moves.push(key.toUpperCase())
        } else {
            game.moves.push(key)
        }

        this.moveActor(this.player, playerDest, ctrl)

        //update clones
        for (var i = 0; i < this.clones.length; i++) {
            let dest
            switch (dir) {
                case DIR.UP:
                    dest = this.clones[i].pos.getUpPos()
                    break;
                case DIR.DOWN:
                    dest = this.clones[i].pos.getDownPos()
                    break;
                case DIR.LEFT:
                    dest = this.clones[i].pos.getLeftPos()
                    break;
                case DIR.RIGHT:
                    dest = this.clones[i].pos.getRightPos()
                    break;
                case DIR.WAIT:
                    dest = this.clones[i].pos
                    break;
            }
            this.moveActor(this.clones[i], dest, ctrl)
        }

        //update ai
        if (!(this.player.powerUp instanceof SuperSpeed && this.player.powerUp.timer % 2 === 1)) {
            game.updateAI()
        }
        if (this.laps / LEVEL_LAPS >= 5) { //disco mode
            this.updateBackgroundColours()
        }
        this.draw()
        //decrement powerup
        //TODO make this logic more readable
        if (this.player.powerUp !== null) {
            this.player.powerUp.timer--
            if (this.player.powerUp.timer < 0) {
                this.player.powerUp = null
            }
        }
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

        //deny moves off screen for clones
        if ((dest.x < 0 || dest.x >= BOARD_WIDTH) && actor instanceof Clone) return
        let target = this.board[dest.x][dest.y]

        if (actor instanceof Player || actor instanceof Clone) {
            //player only actions
            if (actor instanceof Player) {
                //check for win condition
                let targetX = this.directionIsRight ? BOARD_WIDTH : -1 //these are offscreen x values as the player needs to actively move off the screen to win
                if (dest.x === targetX) {
                    this.resetRound()
                }

                //check for murder
                if (this.player.powerUp instanceof LethalBlows && target instanceof Actor) {
                    this.moveActor(target, null);
                    if (target instanceof Sheep && !target.eaten) {
                        remove(this.sheeps, target)
                        this.sheepCount--
                    }
                    if (target instanceof Sheep && target.eaten) {
                        remove(this.sheeps, target)
                        this.wolfCount--
                    }
                    if (target instanceof Wolf) {
                        remove(this.wolves, target)
                        this.wolfCount--
                    }
                    return
                }

                //check for player hitting sheep
                if (ctrl && target instanceof Sheep && !target.eaten) {
                    this.board[dest.x][dest.y].rooted = true
                    this.board[dest.x][dest.y].eaten = true
                    this.sheepCount--
                    this.wolfCount++
                    //TODO build array of eaten sheep and move that into wolves on reset
                    //TODO extract this into a function
                    //add power up
                    this.player.powerUp = target.powerUp

                    //TODO spawn clones randomly around player
                    if (this.player.powerUp instanceof Cloned) {

                    }
                    return
                }

                //check for MoneyBags dropping boulders
                if (ctrl && this.player.powerUp instanceof MoneyBags && this.score >= 1 && target == null) {
                    let boulder = new Boulder(new Pos(dest.x, dest.y))
                    this.board[dest.x][dest.y] = boulder
                    this.boulders.push(boulder)
                    this.score--
                    document.getElementById('score').innerText = "Score: " + this.score
                    return
                }

                //check for deploying a clone
                if (ctrl && this.player.powerUp instanceof Cloned && target == null) {
                    let clone = new Clone(new Pos(dest.x, dest.y))
                    this.board[dest.x][dest.y] = clone
                    this.clones.push(clone)
                    return
                }

                //check for WolfeDisguise dropping decoys
                if (ctrl && this.player.powerUp instanceof WolfDisguise && this.player.powerUp.decoyCount > 0 && target == null) {
                    let decoy = new Decoy(new Pos(dest.x, dest.y))
                    this.board[dest.x][dest.y] = decoy
                    this.decoys.push(decoy)
                    this.player.powerUp.decoyCount--
                    return
                }

                //check for deploying a clone
                if (ctrl && this.player.powerUp instanceof Cloned && target == null) {
                    let clone = new Clone(new Pos(dest.x, dest.y))
                    this.board[dest.x][dest.y] = clone
                    this.clones.push(clone)
                    return
                }
            }

            //check for player trying to push
            if (target instanceof Sheep || (target instanceof Actor && this.player.powerUp instanceof SuperPush)) {
                this.moveActor(target, Pos.getPushPos(actor.pos, dest))
            }

            //check for coin
            if (target instanceof Coin) {
                remove(this.coins, target)
                this.moveActor(target, null)
                this.score++
                document.getElementById('score').innerText = "Score: " + this.score
            }

            //check for player hitting wolf, we assume they want to hit a wolf if they walk into it
            if (target instanceof Wolf && !target.rooted) {
                this.board[dest.x][dest.y].rooted = true
                return
            }
        }

        //deny moves off screen or into obstruction
        if (dest.x < 0 || dest.x >= BOARD_WIDTH || dest.y < 0 || dest.y >= BOARD_HEIGHT
            || this.board[dest.x][dest.y] instanceof Actor) return

        //perform the move

        //update board
        this.board[actor.pos.x][actor.pos.y] = null
        this.board[dest.x][dest.y] = actor

        //update actor by animate from pos to dest
        // this.animate(actor, dest)
        actor.pos = dest
    }

    animate(actor, dest) {
        this.delayLoop(ANIMATION_FRAMES, MOVE_DELAY / ANIMATION_FRAMES, function (i) {
            let stepX = (ANIMATION_FRAMES - i) * (actor.pos.x - dest.x)
            let stepY = (ANIMATION_FRAMES - i) * (actor.pos.y - dest.y)
            game.context.fillStyle = actor.getColor()
            game.context.fillRect(actor.pos.x * game.tileSize + stepX, actor.pos.y * game.tileSize + stepY, game.tileSize, game.tileSize)
        })
    }

    updateAI() {
        //use delay loop to run sheep function followed by wolf function
        //TODO wolves still don't wait their turn as theres only 20 ms until the wolf ai function gets called, meh
        game.sheepAI()
        //after enough time has passed update wolves
        setTimeout(function () {
            game.wolfAI()
        }, MOVE_DELAY * this.sheeps.length)
    }

    sheepAI() {
        let sheepGoals = []
        let targetX = this.directionIsRight ? BOARD_WIDTH - 1 : 0
        for (var y = 0; y < BOARD_HEIGHT; y++) {
            sheepGoals.push(new Pos(targetX, y))
        }

        let graph = new Graph(this.getWeightArray(true))
        //build plan for each sheep
        for (var i = 0; i < this.sheeps.length; i++) {
            let sheep = game.sheeps[i]
            if (sheep.rooted) continue
            if (sheep.pos.x === targetX) {
                game.moveActor(sheep, null)
                remove(game.sheeps, sheep)
                continue
            }
            let start = graph.grid[sheep.pos.x][sheep.pos.y]
            let endPos = Game.nearestGoal(sheep.pos, sheepGoals)
            let end = graph.grid[endPos.x][endPos.y]
            sheep.plan = astar.search(graph, start, end);
        }

        //sort sheeps most advanced at the end
        this.sheeps.sort(function (a, b) {
            if (a.plan === null || typeof a.plan[0] === 'undefined') return -1
            if (b.plan === null || typeof b.plan[0] === 'undefined') return 1
            return a.plan.length <= b.plan.length ? 1 : -1
        })
        this.delayLoop(this.sheeps.length, MOVE_DELAY, function (i) { //This must iterate in reverse as we are removing array elements
            let sheep = game.sheeps[i]
            if (sheep.rooted) return

            let nextStep = sheep.plan[0];
            if (typeof nextStep !== 'undefined') {
                game.moveActor(sheep, new Pos(nextStep.x, nextStep.y))
            } else {
                game.millAbout(sheep)
            }
            game.draw()
        })
    }

    wolfAI() {
        let wolfGoals = []
        if (!(this.player.powerUp instanceof WolfDisguise)) {
            wolfGoals.push(this.player.pos)
        }

        for (var i = 0; i < game.sheeps.length; i++) {
            let sheep = game.sheeps[i]
            if (!sheep.eaten) {
                wolfGoals.push(sheep.pos)
            }
        }

        if (game.decoys.length > 0) {
            wolfGoals = []
            for (var i = 0; i < game.decoys.length; i++) {
                let decoy = game.decoys[i]
                if (!decoy.eaten) {
                    wolfGoals.push(decoy.pos)
                }
            }
        }

        let weights = this.getWeightArray()
        var BREAK_OUTER = false
        this.delayLoop(this.wolves.length, MOVE_DELAY, function (i) {
            if (BREAK_OUTER) return
            let wolf = game.wolves[i]
            if (wolf.rooted) return
            let endPos = Game.nearestGoal(wolf.pos, wolfGoals)
            if (endPos == null) {
                game.millAbout(wolf)
                game.draw()
                return
            }
            //make rooted sheep untraversable
            if (game.board[endPos.x][endPos.y] instanceof Actor && game.board[endPos.x][endPos.y].rooted) {
                weights[endPos.x][endPos.y] = 1
            }
            let graph = new Graph(weights)
            let start = graph.grid[wolf.pos.x][wolf.pos.y]
            let end = graph.grid[endPos.x][endPos.y]
            let nextStep = astar.search(graph, start, end)[0];
            if (typeof nextStep !== 'undefined') {
                if (Math.abs(wolf.pos.x - nextStep.x) + Math.abs(wolf.pos.y - nextStep.y) === 1) {
                    let target = game.board[nextStep.x][nextStep.y]
                    //attack the target
                    if (target instanceof Sheep) {
                        target.rooted = true
                        target.eaten = true
                        game.sheepCount--
                        game.wolfCount++
                    }
                    if (target instanceof Decoy) {
                        this.moveActor(target, null);
                        remove(this.decoys, target)
                    }
                    if (target instanceof Clone) {
                        this.moveActor(target, null);
                        remove(this.clones, target)
                    }
                    if (target instanceof Player) {
                        if (game.score > 0) {
                            addHighscore()
                        }
                        game.initialiseGame()
                        BREAK_OUTER = true
                        return
                    }
                }
                game.moveActor(wolf, new Pos(nextStep.x, nextStep.y))
            } else {
                game.millAbout(wolf)
            }
            game.draw()
        })
    }

    delayLoop(i, timeout, func) {
        this.inputLock = true
        if (--i < 0) {
            this.inputLock = false
            return
        }
        setTimeout(function () {
            func(i)
            game.delayLoop(i, timeout, func)
        }, timeout)
    }

    millAbout(actor) {
        switch (parseInt(this.gameRandom.nextFloat() * 4)) {
            case 0:
                this.moveActor(actor, actor.pos.getRightPos())
                break
            case 1:
                this.moveActor(actor, actor.pos.getLeftPos())
                break
            case 2:
                this.moveActor(actor, actor.pos.getUpPos())
                break
            case 3:
                this.moveActor(actor, actor.pos.getDownPos())
                break
        }
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
                    for (var i = 0; i < game.wolves.length; i++) {
                        let wolf = game.wolves[i]
                        if (wolf.rooted) continue
                        if (Pos.adjacent(wolf.pos, new Pos(x, y))) {
                            array[x][y] = 0
                        }
                    }
                }
            }
        }
        return array;
    }

    updateBackgroundColours() {
        let level = parseInt(this.laps / LEVEL_LAPS + 1)
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
            color += letters[Math.floor(this.gameRandom.nextFloat() * 16)];
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
        this.color = '#000000'
        this.rooted = false
        this.plan = null
    }

    getColor() {
        return this.color
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#00BFFF'
        this.powerUp = null
    }

    getColor() {
        if (this.powerUp == null || this.powerUp.timer === 2 || this.powerUp.timer === 4) {
            return this.color
        } else if (this.powerUp instanceof PowerUp) {
            return this.powerUp.getColor()
        }
    }
}

class Sheep extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#ffebd2'
        this.eaten = false
        this.powerUp = PowerUp.getRandom()
    }

    getColor() {
        if (this.eaten) {
            return '#ff8b72'
        }
        if (this.rooted) {
            return '#bfab92'
        }
        if (powerKey && Pos.adjacent(game.player.pos, this.pos)) {
            return this.powerUp.getColor()
        }
        return this.color
    }
}

class Decoy extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#77BFFF'
        this.eaten = false
    }

    getColor() {
        if (this.eaten) {
            return '#ff8b72'
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

class Coin extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#ffcc00'
        this.rooted = true
    }
}

class Clone extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#00BFFF'
        this.powerUp = null
    }
}

class PowerUp {
    constructor() {
        this.color = '#000000'
        this.timer = 20
    }

    static get WEIGHT() {
        return 10
    }

    getColor() {
        return this.color
    }

    static getRandom() {
        let totalWeight = SuperPush.WEIGHT
            + WolfDisguise.WEIGHT
            + LethalBlows.WEIGHT
            + SuperSpeed.WEIGHT
            + CoinSurprise.WEIGHT
            + ChainLightning.WEIGHT
            + MoneyBags.WEIGHT
            + Rescue.WEIGHT
            + Cloned.WEIGHT
        var pill = 0
        let rand = game.gameRandom.nextFloat() * totalWeight
        // console.log(totalWeight)
        // console.log(pill)
        // console.log(rand)
        if (rand < (SuperPush.WEIGHT + pill)) return new SuperPush()
        pill += SuperPush.WEIGHT
        if (rand < (WolfDisguise.WEIGHT + pill)) return new WolfDisguise()
        pill += WolfDisguise.WEIGHT
        if (rand < (LethalBlows.WEIGHT + pill)) return new LethalBlows()
        pill += LethalBlows.WEIGHT
        if (rand < (SuperSpeed.WEIGHT + pill)) return new SuperSpeed()
        pill += SuperSpeed.WEIGHT
        if (rand < (CoinSurprise.WEIGHT + pill)) return new CoinSurprise()
        pill += CoinSurprise.WEIGHT
        if (rand < (ChainLightning.WEIGHT + pill)) return new ChainLightning()
        pill += ChainLightning.WEIGHT
        if (rand < (MoneyBags.WEIGHT + pill)) return new MoneyBags()
        pill += MoneyBags.WEIGHT
        if (rand < (Rescue.WEIGHT + pill)) return new Rescue()
        pill += Rescue.WEIGHT
        if (rand < (Cloned.WEIGHT + pill)) return new Cloned()
        pill += Cloned.WEIGHT
        return new SuperPush()
    }
}

class SuperPush extends PowerUp {
    constructor() {
        super()
        this.color = '#996655'
    }
}

class WolfDisguise extends PowerUp {
    constructor() {
        super()
        this.color = '#ff0099'
        this.decoyCount = 1
    }
}

class SuperSpeed extends PowerUp {
    constructor() {
        super()
        this.color = '#ffff88'
    }
}

class LethalBlows extends PowerUp {
    constructor() {
        super()
        this.color = '#000000'
        this.timer = 6
    }

    static get WEIGHT() {
        return 5
    }
}

class CoinSurprise extends PowerUp { //spawns coins and gives 2x multiplier
    constructor() {
        super()
        this.color = '#00BFFF'
        this.timer = 1
    }

    static get WEIGHT() {
        return 0
    }
}

class ChainLightning extends PowerUp {
    constructor() {
        super()
        this.color = '#eeeeff'
    }

    static get WEIGHT() {
        return 0
    }
}

class Rescue extends PowerUp {
    constructor() {
        super()
        this.color = '#eeeeff'
        this.timer = 999
    }

    static get WEIGHT() {
        return 0
    }
}

class MoneyBags extends PowerUp {
    constructor() {
        super()
        this.color = '#888888'
        this.timer = 999
    }

    static get WEIGHT() {
        return 5
    }
}

class Cloned extends PowerUp {
    constructor() {
        super()
        this.color = '#88eeaa'
        this.timer = 10
    }

    static get WEIGHT() {
        return 5
    }
}

function addHighscore() {
    var person = prompt(
        'Congratulations, you lose! Enter your name to save your score:'
    )
    if (person != null && person !== '') {
        $.post(
            '/highscore',
            {
                name: person,
                score: game.score,
                seed: game.seed,
                moves: game.moves
            }
        );
    }
}

function remove(array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
        array.splice(index, 1);
    }
}

//debug
function enableTeleport() {
    game.teleport = true
}

function eatAllTheSheep() {
    for (var i = 0; i < game.sheeps.length; i++) {
        let sheep = game.sheeps[i]
        sheep.eaten = true;
        sheep.rooted = true;
        game.sheepCount--
        game.wolfCount++
    }
}

function endGame() {
    if (game.score > 0) {
        addHighscore()
    }
    game.initialiseGame()
}

function replay(seed, moves) {
    MOVE_DELAY = 0
    game.initialiseGame(seed)
    replayLoop(moveArray.length, 500, function (i) {
        console.log(moves[i])
        let ctrl = moves[i].toUpperCase() === moves[i]
        switch (moves[i].toUpperCase()) {
            case 'ARROWLEFT':
            case 'A':
                game.update(game.player.pos.getLeftPos(), ctrl, moves[i])
                break
            case 'ARROWUP':
            case 'W':
                game.update(game.player.pos.getUpPos(), ctrl, moves[i])
                break
            case 'ARROWRIGHT':
            case 'D':
                game.update(game.player.pos.getRightPos(), ctrl, moves[i])
                break
            case 'ARROWDOWN':
            case 'S':
                game.update(game.player.pos.getDownPos(), ctrl, moves[i])
                break
            case ' ':
                game.update(game.player.pos, ctrl, moves[i])
                break
            default:
        }
    })
    MOVE_DELAY = 10
}

function replayLoop(i, timeout, func) {
    if (--i < 0) {
        return
    }
    setTimeout(function () {
        func(i)
        replayLoop(i, timeout, func)
    }, timeout)
}

function testPowerSpread() {
    var ass = 0
    var push = 0
    var speed = 0
    var hide = 0
    for (var i = 0; i < 10000; i++) {
        let powerUp = PowerUp.getRandom()
        if (powerUp instanceof LethalBlows) {
            ass++
        } else if (powerUp instanceof SuperPush) {
            push++
        } else if (powerUp instanceof SuperSpeed) {
            speed++
        } else if (powerUp instanceof WolfDisguise) {
            hide++
        }
    }
    console.log(ass)
    console.log(push)
    console.log(speed)
    console.log(hide)
}