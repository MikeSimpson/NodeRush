class Game {

    constructor() {
        //initialise canvas
        let div = document.getElementById('canvas_container');
        let canvas = document.createElement('canvas');
        canvas.id = 'bullrush_canvas';
        this.tileSize = parseInt(div.offsetWidth / BOARD_WIDTH);
        canvas.width = this.tileSize * BOARD_WIDTH;
        canvas.height = this.tileSize * BOARD_HEIGHT;
        div.appendChild(canvas);
        this.context = canvas.getContext('2d')
    }

    initialiseGame(seed) {
        //configure seed
        this.seed = seed || document.getElementById('seed').value;
        if (this.seed === "" || (this.seed === this.lastSeed && seed === null)) {
            this.seed = parseInt(Math.random() * 2147483647);
            // document.getElementById('seed').value = seed;
        }

        this.lastSeed = this.seed;
        this.genRandom = new Random(this.seed);
        this.gameRandom = new Random(this.genRandom.next());

        this.directionIsRight = true;

        this.laps = 0;
        this.score = 0;
        document.getElementById('score').innerText = "Score: " + this.score;
        document.getElementById('lap').innerText = "Lap: " + (this.laps + 1);
        this.updateBackgroundColours();

        //initialise board
        this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT);
        this.spawnBoulders();

        //initialise actors
        this.playerCount = PLAYER_COUNT;
        this.players = [];
        this.sheepCount = BOARD_HEIGHT - this.playerCount; //zzzzzz TODO this variable shouldn't really be needed
        this.wolfCount = 1;
        // this.player = new Player(new Pos(-1, -1)) //pos will be overidden
        this.spawnActors();

        //clear debug flags
        this.teleport = false;

        this.inputLock = false; //used to lock input while delayed loops are running

        this.moves = [];

        document.getElementById('newGame').innerText = "Restart";

        this.draw()
    }

    spawnActors() {
        let startX = this.directionIsRight ? 0 : BOARD_WIDTH - 1;

        //spawn players
        var playersCreated = 0;
        if (this.players.length === 0) {
            while (this.playerCount > 0) {
                //attempt to add a player
                let y = parseInt(this.gameRandom.nextFloat() * BOARD_HEIGHT);
                if (!(this.board[startX][y] instanceof Actor)) {
                    let player = new Player(new Pos(startX, y), playersCreated);
                    this.board[startX][y] = player;
                    this.players.push(player);
                    playersCreated++;
                    if (playersCreated === this.playerCount) break
                }
            }
        } else {
            while (this.playerCount > 0) {
                //attempt to place a player
                let y = parseInt(this.gameRandom.nextFloat() * BOARD_HEIGHT);
                if (!(this.board[startX][y] instanceof Actor)) {
                    this.board[startX][y] = this.players[playersCreated];
                    this.players[playersCreated].pos = new Pos(startX, y);
                    playersCreated++;
                    if (playersCreated === this.playerCount) break
                }
            }
        }

        //spawn sheep
        this.sheeps = [];
        var sheepsCreated = 0;
        while (this.sheepCount > 0) {
            //attempt to add a sheep
            let y = parseInt(this.gameRandom.nextFloat() * BOARD_HEIGHT);
            if (!(this.board[startX][y] instanceof Actor)) {
                let sheep = new Sheep(new Pos(startX, y));
                this.board[startX][y] = sheep;
                this.sheeps.push(sheep);
                sheepsCreated++;
                if (sheepsCreated === this.sheepCount) break
            }
        }

        //spawn wolves
        this.wolves = [];
        var wolvesCreated = 0;
        while (this.wolfCount > 0) {
            //attempt to add a wolf
            let x = parseInt(this.gameRandom.nextFloat() * BOARD_WIDTH / 2);
            //force wolf to second half of board
            if (this.directionIsRight) x += parseInt(BOARD_WIDTH / 2);
            let y = parseInt(this.gameRandom.nextFloat() * BOARD_HEIGHT);
            if (!(this.board[x][y] instanceof Actor)) {
                let wolf = new Wolf(new Pos(x, y));
                this.board[x][y] = wolf;
                this.wolves.push(wolf);
                wolvesCreated++;
                if (wolvesCreated === this.wolfCount) break
            }
        }

        //spawn coin
        this.coins = [];
        while (true) {
            //attempt to add a coin
            let x = parseInt(this.genRandom.nextFloat() * BOARD_WIDTH);
            let y = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT);
            if (!(this.board[x][y] instanceof Actor)) {
                let coin = new Coin(new Pos(x, y));
                this.board[x][y] = coin;
                this.coins.push(coin);
                break
            }
        }

        //spawn powerup
        this.powerUps = [];
        if (this.laps % LEVEL_LAPS === 0 && this.laps !== 0) {
            while (true) {
                //attempt to add a powerup
                let x = parseInt(this.genRandom.nextFloat() * BOARD_WIDTH);
                let y = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT);
                if (!(this.board[x][y] instanceof Actor)) {
                    let powerup = PowerUp.getRandomHat();
                    powerup.pos = new Pos(x, y);
                    this.board[x][y] = powerup;
                    this.powerUps.push(powerup);
                    break
                }
            }
        }

        //clear transient actors
        this.clones = [];
        this.decoys = []
    }

    spawnBoulders() {
        this.boulders = [];
        this.crates = [];
        //loop every non edge tile and chuck a maybe boulder in it
        for (var x = 1; x < BOARD_WIDTH - 1; x++) {
            for (var y = 0; y < BOARD_HEIGHT; y++) {
                if (this.genRandom.nextFloat() < 0.2) {
                    let boulder = new Boulder(new Pos(x, y));
                    this.board[x][y] = boulder;
                    this.boulders.push(boulder)
                }
            }
        }
    }

    resetRound() {
        //update laps
        this.laps++;
        this.score++;
        document.getElementById('score').innerText = "Score: " + this.score;
        document.getElementById('lap').innerText = "Lap: " + (this.laps + 1);
        //every x laps, reset but up the tempo
        if (this.laps % LEVEL_LAPS === 0) {
            this.updateBackgroundColours();
            this.wolfCount = parseInt(this.laps / LEVEL_LAPS + 1);
            this.sheepCount = BOARD_HEIGHT - 1;
            //reset board
            this.board = Game.createBoard(BOARD_WIDTH, BOARD_HEIGHT);
            this.spawnBoulders()
            //TODO mutate boulders?
        }

        //reverse direction
        this.directionIsRight = !this.directionIsRight;

        //reset actors
        for (var i = 0; i < this.players.length; i++) {
            this.moveActor(this.players[i], null)
        }
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
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
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

    update(dir, ctrl, key, playerIndex) {
        if (this.playerCount === 1) playerIndex = 0;
        let playerDest;
        switch (dir) {
            case DIR.UP:
                playerDest = this.players[playerIndex].pos.getUpPos();
                break;
            case DIR.DOWN:
                playerDest = this.players[playerIndex].pos.getDownPos();
                break;
            case DIR.LEFT:
                playerDest = this.players[playerIndex].pos.getLeftPos();
                break;
            case DIR.RIGHT:
                playerDest = this.players[playerIndex].pos.getRightPos();
                break;
            case DIR.WAIT:
                playerDest = this.players[playerIndex].pos;
                break;
        }
        if (this.inputLock) return;
        if (ctrl) {
            game.moves.push(key.toUpperCase())
        } else {
            game.moves.push(key)
        }

        try {
            this.moveActor(this.players[playerIndex], playerDest, ctrl)
        } catch { //catch my clever joke
            return
        }

        //update clones
        for (var i = 0; i < this.clones.length; i++) {
            let dest;
            switch (dir) {
                case DIR.UP:
                    dest = this.clones[i].pos.getUpPos();
                    break;
                case DIR.DOWN:
                    dest = this.clones[i].pos.getDownPos();
                    break;
                case DIR.LEFT:
                    dest = this.clones[i].pos.getLeftPos();
                    break;
                case DIR.RIGHT:
                    dest = this.clones[i].pos.getRightPos();
                    break;
                case DIR.WAIT:
                    dest = this.clones[i].pos;
                    break;
            }
            this.moveActor(this.clones[i], dest, ctrl)
        }

        //update ai
        if (!(this.players[playerIndex].powerUp[this.players[playerIndex].powerUp.length - 1] instanceof SuperSpeed && this.players[playerIndex].powerUp[this.players[playerIndex].powerUp.length - 1].timer % 3 !== 0)
            && !(this.players[playerIndex].powerUp[this.players[playerIndex].powerUp.length - 1] instanceof SemiSpeed && this.players[playerIndex].powerUp[this.players[playerIndex].powerUp.length - 1].timer % 5 === 0)
        ) {
            game.updateAI()
        }
        if (this.laps / LEVEL_LAPS >= 5) { //disco mode
            this.updateBackgroundColours()
        }
        this.draw();
        //decrement powerup
        //TODO make this logic more readable
        if (this.players[playerIndex].powerUp.length !== 0) {
            this.players[playerIndex].powerUp[this.players[playerIndex].powerUp.length - 1].timer--;
            if (this.players[playerIndex].powerUp[this.players[playerIndex].powerUp.length - 1].timer < 0) {
                this.players[playerIndex].powerUp.pop()
            }
        }

        //change new game text
        if (this.score > 1) {
            document.getElementById('newGame').innerText = "Retire"
        }
    }

    moveActor(actor, dest, ctrl) {
        //remove actor if dest null
        if (dest === null) {
            //remove actor
            this.board[actor.pos.x][actor.pos.y] = null;
            return
        }

        //deny moves more than one tile away
        if (!actor.pos.adjacent(dest) && !this.teleport) return;

        if (actor instanceof Player || actor instanceof Clone) {

            //check for win condition
            let targetX = this.directionIsRight ? BOARD_WIDTH : -1; //these are offscreen x values as the player needs to actively move off the screen to win
            if (dest.x === targetX && actor instanceof Player) {
                this.resetRound();
                throw "a party" //this is important, do not remove
            }

            //deny moves off screen
            if ((dest.x < 0 || dest.x >= BOARD_WIDTH)) return;

            let target = this.board[dest.x][dest.y];

            //player only actions
            if (actor instanceof Player) {
                //check for player hitting sheep
                if (ctrl && target instanceof Sheep && !target.eaten) {
                    this.board[dest.x][dest.y].rooted = true;
                    this.board[dest.x][dest.y].eaten = true;
                    this.sheepCount--;
                    this.wolfCount++;
                    //TODO build array of eaten sheep and move that into wolves on reset
                    //TODO extract this into a function
                    //add power up
                    if (actor.powerUp.length !== 0 && actor.powerUp[actor.powerUp.length - 1].constructor === target.powerUp.constructor) {
                        actor.powerUp[actor.powerUp.length - 1].timer += target.powerUp.timer * Math.min((parseInt(actor.powerUp[actor.powerUp.length - 1].timer / target.powerUp.timer) + 1), 3)
                    } else {
                        if (target.powerUp instanceof Coin) {
                            this.score++;
                            document.getElementById('score').innerText = "Score: " + this.score
                        } else {
                            actor.powerUp.push(target.powerUp);
                        }
                        //TODO spawn clones randomly around player
                        if (actor.powerUp[actor.powerUp.length - 1] instanceof Cloned) {

                        }
                        if (actor.powerUp[actor.powerUp.length - 1] instanceof Teleport) {
                            while (true) {
                                //attempt to teleport player
                                let x = parseInt(this.genRandom.nextFloat() * BOARD_WIDTH);
                                let y = parseInt(this.genRandom.nextFloat() * BOARD_HEIGHT);
                                if (!(this.board[x][y] instanceof Actor)) {
                                    this.board[actor.pos.x][actor.pos.y] = null;
                                    this.board[x][y] = actor;
                                    actor.pos = new Pos(x, y)
                                    break
                                }
                            }
                        }
                    }
                    // console.log(actor.powerUp.timer)
                    return
                }

                //check for powerup pick up
                if (ctrl && target instanceof PowerUp) {
                    remove(this.powerUps, target);
                    this.moveActor(target, null);
                    actor.powerUp.push(target);
                    return
                }

                //check for deploying a clone
                if (ctrl && actor.powerUp[actor.powerUp.length - 1] instanceof Cloned && target == null) {
                    let clone = new Clone(new Pos(dest.x, dest.y));
                    this.board[dest.x][dest.y] = clone;
                    this.clones.push(clone);
                    return
                }

                //check for WolfDisguise dropping decoys
                if (ctrl && actor.powerUp[actor.powerUp.length - 1] instanceof WolfDisguise && actor.powerUp[actor.powerUp.length - 1].decoyCount > 0 && target == null) {
                    let decoy = new Decoy(new Pos(dest.x, dest.y));
                    this.board[dest.x][dest.y] = decoy;
                    this.decoys.push(decoy);
                    actor.powerUp[actor.powerUp.length - 1].decoyCount--;
                    return
                }
            }

            //check for murder
            if (actor.powerUp[actor.powerUp.length - 1] instanceof LethalBlows && target instanceof Actor) {
                this.moveActor(target, null);
                if (target instanceof Sheep && !target.eaten) {
                    remove(this.sheeps, target);
                    this.sheepCount--
                }
                if (target instanceof Sheep && target.eaten) {
                    remove(this.sheeps, target);
                    this.wolfCount--
                }
                if (target instanceof Wolf) {
                    remove(this.wolves, target);
                    this.wolfCount--
                }
                return
            }

            //check for healing
            if (ctrl && actor.powerUp[actor.powerUp.length - 1] instanceof Medic && target instanceof Sheep && this.score >= 1) {
                if (target instanceof Sheep && target.eaten) {
                    remove(this.wolves, target);
                    target.eaten = false;
                    target.rooted = false;
                    this.sheepCount++;
                    this.wolfCount--;
                    this.score--;
                    document.getElementById('score').innerText = "Score: " + this.score;
                }
                return
            }

            //check for MoneyBags dropping crates
            if (ctrl && actor.powerUp[actor.powerUp.length - 1] instanceof MoneyBags && this.score >= 1 && target == null) {
                let crate = new Crate(new Pos(dest.x, dest.y));
                this.board[dest.x][dest.y] = crate;
                this.crates.push(crate);
                this.score--;
                document.getElementById('score').innerText = "Score: " + this.score;
                return
            }

            //check for player hitting wolf, we assume they want to hit a wolf if they walk into it
            if (target instanceof Wolf && !target.rooted) {
                this.board[dest.x][dest.y].rooted = true;
                return
            }

            //check for player trying to push
            if (target instanceof Sheep || target instanceof Crate || target instanceof PowerUp || (target instanceof Actor && actor.powerUp[actor.powerUp.length - 1] instanceof SuperPush)) {
                this.moveActor(target, actor.pos.getPushPos(dest))
            }

            //check for coin
            if (target instanceof Coin) {
                remove(this.coins, target);
                this.moveActor(target, null);
                this.score++;
                document.getElementById('score').innerText = "Score: " + this.score
            }
        }

        //deny moves off screen or into obstruction
        if (dest.x < 0 || dest.x >= BOARD_WIDTH || dest.y < 0 || dest.y >= BOARD_HEIGHT
            || this.board[dest.x][dest.y] instanceof Actor) return;

        //perform the move

        //update board
        this.board[actor.pos.x][actor.pos.y] = null;
        this.board[dest.x][dest.y] = actor;

        //update actor by animate from pos to dest
        // this.animate(actor, dest)
        actor.pos = dest
    }

    animate(actor, dest) {
        this.delayLoop(ANIMATION_FRAMES, MOVE_DELAY / ANIMATION_FRAMES, function (i) {
            let stepX = (ANIMATION_FRAMES - i) * (actor.pos.x - dest.x);
            let stepY = (ANIMATION_FRAMES - i) * (actor.pos.y - dest.y);
            game.context.fillStyle = actor.getColor();
            game.context.fillRect(actor.pos.x * game.tileSize + stepX, actor.pos.y * game.tileSize + stepY, game.tileSize, game.tileSize)
        })
    }

    updateAI() {
        //use delay loop to run sheep function followed by wolf function
        //TODO wolves still don't wait their turn as theres only 20 ms until the wolf ai function gets called, meh
        game.sheepAI();
        //after enough time has passed update wolves
        setTimeout(function () {
            game.wolfAI()
        }, MOVE_DELAY * this.sheeps.length)
    }

    sheepAI() {
        let sheepGoals = [];
        let targetX = this.directionIsRight ? BOARD_WIDTH - 1 : 0;
        for (var y = 0; y < BOARD_HEIGHT; y++) {
            sheepGoals.push(new Pos(targetX, y))
        }

        let graph = new Graph(this.getWeightArray(true));
        //build plan for each sheep
        for (var i = this.sheeps.length - 1; i >= 0; i--) {
            let sheep = game.sheeps[i];
            if (sheep.rooted) continue;
            if (sheep.pos.x === targetX) {
                game.moveActor(sheep, null);
                remove(game.sheeps, sheep);
                continue
            }
            let start = graph.grid[sheep.pos.x][sheep.pos.y];
            let endPos = Game.nearestGoal(sheep.pos, sheepGoals);
            let end = graph.grid[endPos.x][endPos.y];
            sheep.plan = astar.search(graph, start, end);
        }

        //sort sheeps most advanced at the end
        this.sheeps.sort(function (a, b) {
            if (a.plan === null || typeof a.plan[0] === 'undefined') return -1;
            if (b.plan === null || typeof b.plan[0] === 'undefined') return 1;
            return a.plan.length <= b.plan.length ? 1 : -1
        });
        this.delayLoop(this.sheeps.length, MOVE_DELAY, function (i) { //This must iterate in reverse as we are removing array elements
            let sheep = game.sheeps[i];
            if (sheep.rooted) return;

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
        let wolfGoals = [];

        for (var i = 0; i < game.players.length; i++) {
            let player = game.players[i];
            if (!(player.powerUp[player.powerUp.length - 1] instanceof WolfDisguise)) {
                wolfGoals.push(player.pos)
            }
        }

        for (var i = 0; i < game.sheeps.length; i++) {
            let sheep = game.sheeps[i];
            if (!sheep.eaten) {
                wolfGoals.push(sheep.pos)
            }
        }

        for (var i = 0; i < game.clones.length; i++) {
            let sheep = game.clones[i];
            wolfGoals.push(sheep.pos)
        }

        if (game.decoys.length > 0) {
            wolfGoals = [];
            for (var i = 0; i < game.decoys.length; i++) {
                let decoy = game.decoys[i];
                if (!decoy.eaten) {
                    wolfGoals.push(decoy.pos)
                }
            }
        }

        let weights = this.getWeightArray();
        let flankerWeights = this.getWeightArray(false, false, true);

        var BREAK_OUTER = false;
        this.delayLoop(this.wolves.length, MOVE_DELAY, function (i) {
            if (BREAK_OUTER) return;
            let wolf = game.wolves[i];
            if (wolf.rooted) return;
            let endPos = Game.nearestGoal(wolf.pos, wolfGoals);
            if (endPos == null) {
                game.millAbout(wolf);
                game.draw();
                return
            }
            //make rooted sheep untraversable
            if (game.board[endPos.x][endPos.y] instanceof Actor && game.board[endPos.x][endPos.y].rooted) {
                weights[endPos.x][endPos.y] = 1;
                flankerWeights[endPos.x][endPos.y] = 1
            }
            let graph = new Graph(weights);
            if (wolf.flanker) {
                graph = new Graph(flankerWeights)
            }
            let start = graph.grid[wolf.pos.x][wolf.pos.y];
            let end = graph.grid[endPos.x][endPos.y];
            let nextStep = astar.search(graph, start, end)[0];
            if (typeof nextStep !== 'undefined') {
                if (Math.abs(wolf.pos.x - nextStep.x) + Math.abs(wolf.pos.y - nextStep.y) === 1) {
                    let target = game.board[nextStep.x][nextStep.y];
                    //attack the target
                    if (target instanceof Sheep) {
                        target.rooted = true;
                        target.eaten = true;
                        game.sheepCount--;
                        game.wolfCount++
                    }
                    if (target instanceof Decoy) {
                        game.moveActor(target, null);
                        remove(game.decoys, target)
                    }
                    if (target instanceof Clone) {
                        game.moveActor(target, null);
                        remove(game.clones, target)
                    }
                    if (target instanceof Player) {
                        if (target.powerUp[target.powerUp.length - 1] instanceof Undead && game.score > 0) {
                            game.score--;
                            document.getElementById('score').innerText = "Score: " + game.score;
                            return
                        }
                        if (game.score > 0) {
                            addHighscore()
                        }
                        game.initialiseGame();
                        BREAK_OUTER = true;
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

    playerAuto(dest) {
        let targetX = this.directionIsRight ? BOARD_WIDTH - 1 : 0;
        if (this.players[0].pos.x === targetX) {
            if (this.directionIsRight) {
                this.update(DIR.RIGHT, false, "AutoRight", 0)
            } else {
                this.update(DIR.LEFT, false, "AutoLeft", 0)
            }
            return
        }
        if (dest.adjacent(this.players[0].pos)) {
            let nextStep = dest;
            if (nextStep.x === game.players[0].pos.getLeftPos().x) {
                game.update(DIR.LEFT, powerKey, "AutoLeft", 0)
            } else if (nextStep.x === game.players[0].pos.getRightPos().x) {
                game.update(DIR.RIGHT, powerKey, "AutoRight", 0)
            } else if (nextStep.y === game.players[0].pos.getDownPos().y) {
                game.update(DIR.DOWN, powerKey, "AutoDown", 0)
            } else if (nextStep.y === game.players[0].pos.getUpPos().y) {
                game.update(DIR.UP, powerKey, "AutoUp", 0)
            }
            powerKey = false;
            return
        }
        let graph = new Graph(this.getWeightArray(true, true));
        let start = graph.grid[this.players[0].pos.x][this.players[0].pos.y];
        let end = graph.grid[dest.x][dest.y];
        let plan = astar.search(graph, start, end).reverse();

        MOVE_DELAY = 0;
        this.useInputLock = false;
        replayLoop(plan.length, 50, function (i) { //This must iterate in reverse as we are removing array elements
            let nextStep = new Pos(plan[i].x, plan[i].y);
            if (nextStep.x === game.players[0].pos.getLeftPos().x) {
                game.update(DIR.LEFT, powerKey, "AutoLeft", 0)
            } else if (nextStep.x === game.players[0].pos.getRightPos().x) {
                game.update(DIR.RIGHT, powerKey, "AutoRight", 0)
            } else if (nextStep.y === game.players[0].pos.getDownPos().y) {
                game.update(DIR.DOWN, powerKey, "AutoDown", 0)
            } else if (nextStep.y === game.players[0].pos.getUpPos().y) {
                game.update(DIR.UP, powerKey, "AutoUp", 0)
            }
        });
        powerKey = false;
        MOVE_DELAY = 10
    }

    delayLoop(i, timeout, func) {
        this.inputLock = this.useInputLock;
        if (--i < 0) {
            this.inputLock = false;
            return
        }
        setTimeout(function () {
            func(i);
            game.delayLoop(i, timeout, func)
        }, timeout)
    }

    millAbout(actor) {
        switch (parseInt(this.gameRandom.nextFloat() * 4)) {
            case 0:
                this.moveActor(actor, actor.pos.getRightPos());
                break;
            case 1:
                this.moveActor(actor, actor.pos.getLeftPos());
                break;
            case 2:
                this.moveActor(actor, actor.pos.getUpPos());
                break;
            case 3:
                this.moveActor(actor, actor.pos.getDownPos());
                break
        }
    }

    getWeightArray(sheep = false, player = false, flanker = false) {
        let array = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            array[x] = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.board[x][y] instanceof Actor && this.board[x][y].rooted && !(player && this.board[x][y] instanceof Coin)) {
                    array[x][y] = 0
                } else {
                    array[x][y] = 1
                }
                if (sheep) {
                    for (var i = 0; i < game.wolves.length; i++) {
                        let wolf = game.wolves[i];
                        if (wolf.rooted) continue;
                        if (wolf.pos.adjacent(new Pos(x, y))) {
                            array[x][y] = 0
                        }
                    }
                }
                if (flanker) {
                    for (var i = 0; i < game.wolves.length; i++) {
                        let wolf = game.wolves[i];
                        if (wolf.rooted) continue;
                        if (wolf.pos.x === x && wolf.pos.y === y) {
                            array[x][y] = 0
                        }
                    }
                }
            }
        }
        return array;
    }

    updateBackgroundColours() {
        let level = parseInt(this.laps / LEVEL_LAPS + 1);
        switch (level) {
            case 1:
                this.backgroundA = '#adff2f';
                this.backgroundB = '#9be52a';
                break;
            case 2:
                this.backgroundA = '#e5e57d';
                this.backgroundB = '#ffff8b';
                break;
            case 3:
                this.backgroundA = '#d7ffff';
                this.backgroundB = '#c1e5e5';
                break;
            case 4:
                this.backgroundA = '#7e5426';
                this.backgroundB = '#8c673e';
                break;
            case 5:
                this.backgroundA = '#00cccc';
                this.backgroundB = '#00b7b7';
                break;
            case 6:
                this.backgroundA = '#dddddd';
                this.backgroundB = '#bbbbbb';
                break;
            default:
                this.backgroundA = this.getRandomColor();
                this.backgroundB = this.getRandomColor()
        }
    }

    getRandomColor() {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(this.gameRandom.nextFloat() * 16)];
        }
        return color;
    }

    static createBoard(width, height) {
        let board = [];
        for (let i = 0; i < width; i++) {
            board.push([]);
            for (let j = 0; j < height; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }

    static nearestGoal(start, goals) {
        let minHatten = 1993; //my birthyear
        let goal;
        for (let i = 0; i < goals.length; i++) {
            let distance = astar.heuristics.manhattan(start, goals[i]); //warning, we are using Pos instead of GridNode but I guess it still works #javascript
            if (distance <= minHatten) {
                minHatten = distance;
                goal = goals[i]
            }
        }
        return goal
    }
}
