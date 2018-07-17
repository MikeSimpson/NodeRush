let BOARD_WIDTH = 20
let BOARD_HEIGHT = 10
let LEVEL_LAPS = 5
let MOVE_DELAY = 20
let ANIMATION_FRAMES = 10
let game
var sheepImage = new Image()
var wolfImage = new Image()
var playerImage = new Image()
sheepImage.src = '/sprites/sheep.png'
wolfImage.src = '/sprites/wolf.png'
playerImage.src = '/sprites/player.png'

$(document).ready(function () {
    game = new Game()

    window.addEventListener('keydown', keyListener, true)
    // window.addEventListener('click', clickListener, true)
})

let keyListener = function (e) {
    //prevent browser scrolling
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control'].indexOf(e.key) > -1) {
        e.preventDefault()
    }
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
            game.update(game.player.pos.getLeftPos(), e.ctrlKey || e.altKey || e.shiftKey)
            if(e.ctrlKey || e.altKey || e.shiftKey){
                game.moves = game.moves + 'A, '
            } else {
                game.moves = game.moves + 'a, '
            }
            break
        case 'ArrowUp':
        case 'w':
            game.update(game.player.pos.getUpPos(), e.ctrlKey || e.altKey || e.shiftKey)
            if(e.ctrlKey || e.altKey || e.shiftKey){
                game.moves = game.moves + 'W, '
            } else {
                game.moves = game.moves + 'w, '
            }
            break
        case 'ArrowRight':
        case 'd':
            game.update(game.player.pos.getRightPos(), e.ctrlKey || e.altKey || e.shiftKey)
            if(e.ctrlKey || e.altKey || e.shiftKey){
                game.moves = game.moves + 'D, '
            } else {
                game.moves = game.moves + 'd, '
            }
            break
        case 'ArrowDown':
        case 's':
            game.update(game.player.pos.getDownPos(), e.ctrlKey || e.altKey || e.shiftKey)
            if(e.ctrlKey || e.altKey || e.shiftKey){
                game.moves = game.moves + 'S, '
            } else {
                game.moves = game.moves + 's, '
            }
            break
        case ' ':
            game.update(game.player.pos, e.ctrlKey || e.altKey || e.shiftKey)
            game.moves = game.moves + 'P, '
            break
        default:
    }
}

function dpadInput(key) {
    switch (key) {
        case 'PadLeft':
            game.update(game.player.pos.getLeftPos(), false)
            break
        case 'PadUp':
            game.update(game.player.pos.getUpPos(), false)
            break
        case 'PadRight':
            game.update(game.player.pos.getRightPos(), false)
            break
        case 'PadDown':
            game.update(game.player.pos.getDownPos(), false)
            break
        case 'PadWait':
            game.update(game.player.pos, false)
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
        var seed = document.getElementById('seed').value
        if (seed === "" || seed === this.lastSeed) {
            seed = parseInt(Math.random() * 2147483647);
            // document.getElementById('seed').value = seed;
        }

        this.lastSeed = seed;
        this.genRandom = new Random(seed)
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
        this.spawnActors()

        //clear debug flags
        this.teleport = false

        this.inputLock = false //used to lock input while delayed loops are running

        this.moves = ''

        this.draw()
    }

    spawnActors() {
        let startX = this.directionIsRight ? 0 : BOARD_WIDTH - 1

        let playerY = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT)
        this.player = new Player(new Pos(startX, playerY))
        this.board[startX][playerY] = this.player
        //spawn sheep
        this.sheeps = []
        var sheepsCreated = 0

        while (this.sheepCount > 0) {
            //attempt to add a sheep
            let y = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT)
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
            let x = parseInt(this.genRandom.nextFloat() * BOARD_WIDTH / 2)
            //force wolf to second half of board
            if (this.directionIsRight) x += parseInt(BOARD_WIDTH / 2)
            let y = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT)
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
                if (this.board[x][y] instanceof Player) {
                    this.context.drawImage(playerImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                    continue
                }
                if (this.board[x][y] instanceof Wolf) {
                    this.context.drawImage(wolfImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                    continue
                }
                if (this.board[x][y] instanceof Sheep) {
                    this.context.drawImage(sheepImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                    continue
                }
            }
        }
    }

    update(dest, ctrl) {
        if (this.inputLock) return
        this.moveActor(this.player, dest, ctrl)
        if (!(this.player.powerUp != null && (this.player.powerUp instanceof SuperSpeed) && (this.player.powerUp.timer % 2 === 1))) {
            game.updateAI()
        }
        if (this.laps / LEVEL_LAPS >= 5) { //disco mode
            this.updateBackgroundColours()
        }
        this.draw()
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

        let target

        if (actor instanceof Player) {
            //check for win condition
            let targetX = this.directionIsRight ? BOARD_WIDTH : -1 //these are offscreen x values as the player needs to actively move off the screen to win
            if (dest.x === targetX) {
                this.resetRound()
            }

            target = this.board[dest.x][dest.y]

            //check for coin
            if (target instanceof Coin) {
                remove(this.coins, target)
                this.moveActor(target, null)
                this.score++
                document.getElementById('score').innerText = "Score: " + this.score
                document.getElementById('lap').innerText = "Lap: " + (this.laps + 1)
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

            //check for player hitting wolf, we assume they want to hit a wolf if they walk into it
            if (target instanceof Wolf && !target.rooted) {
                this.board[dest.x][dest.y].rooted = true
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
                this.player.powerUp = PowerUp.getRandom()
                return
            }

            //check for player trying to push
            if (target instanceof Sheep || (target instanceof Actor && this.player.powerUp instanceof SuperPush)) {
                this.moveActor(target, Pos.getPushPos(actor.pos, dest))
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
            //make rooted sheep traversable
            if (game.board[endPos.x][endPos.y] instanceof Actor && game.board[endPos.x][endPos.y].rooted) {
                weights[endPos.x][endPos.y] = 1
            }
            let graph = new Graph(weights)
            let start = graph.grid[wolf.pos.x][wolf.pos.y]
            let end = graph.grid[endPos.x][endPos.y]
            let nextStep = astar.search(graph, start, end)[0];
            if (typeof nextStep !== 'undefined') {
                if (Math.abs(wolf.pos.x - nextStep.x) + Math.abs(wolf.pos.y - nextStep.y) === 1) {
                    //attack the target
                    if (game.board[nextStep.x][nextStep.y] instanceof Sheep) {
                        game.board[nextStep.x][nextStep.y].rooted = true
                        game.board[nextStep.x][nextStep.y].eaten = true
                        game.sheepCount--
                        game.wolfCount++
                    }
                    if (game.board[nextStep.x][nextStep.y] instanceof Player) {
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

class Coin extends Actor {
    constructor(pos) {
        super(pos)
        this.color = '#ffcc00'
        this.rooted = true
    }
}

class PowerUp {
    constructor() {
        this.color = '#000000'
        this.timer = 10
    }

    getColor() {
        return this.color
    }

    static getRandom() {
        switch (parseInt(game.gameRandom.nextFloat() * 4)) {
            case 0:
                return new SuperPush()
            case 1:
                return new WolfDisguise()
            case 2:
                return new SuperSpeed()
            case 3:
                return new LethalBlows()
            default:
                return new SuperPush()
        }
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
    }
}

class SuperSpeed extends PowerUp {
    constructor() {
        super()
        this.color = '#ffff88'
        this.timer = 20
    }
}

class LethalBlows extends PowerUp {
    constructor() {
        super()
        this.color = '#000000'
        this.timer = 6
    }
}

class CoinSuprise extends PowerUp {
    constructor() {
        super()
        this.color = '#00BFFF'
        this.timer = 1
    }
}

class ChainLightning extends PowerUp {
    constructor() {
        super()
        this.color = '#eeeeff'
    }
}

//debug codes
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

function addHighscore() {
    var person = prompt(
        'Congratulations, you lose! Enter your name to save your score:'
    );
    console.log(game.moves)
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