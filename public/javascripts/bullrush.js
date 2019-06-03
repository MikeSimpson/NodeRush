let BOARD_WIDTH = 20;
let BOARD_HEIGHT = 10;
let LEVEL_LAPS = 6;
let MOVE_DELAY = 10;
let ANIMATION_FRAMES = 10;
let PLAYER_COUNT = 1;
let game;
const sheepImage = new Image();
const wolfImage = new Image();
const playerImage = new Image();
sheepImage.src = '/sprites/sheep.png';
wolfImage.src = '/sprites/wolf.png';
playerImage.src = '/sprites/player.png';
let powerKey;
let autoWalking;
const DIR = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4,
    WAIT: 5
};

$(document).ready(function () {
    game = new Game();
    game.initialiseGame();

    window.addEventListener('keydown', keyDownListener, true);

    window.addEventListener('keyup', keyUpListener, true);
    document.getElementById('canvas_container').addEventListener('mousedown', clickDownListener, true)
});

let keyDownListener = function (e) {
    //prevent browser scrolling
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control'].indexOf(e.key) > -1) {
        e.preventDefault()
    }
    switch (e.key) {
        case 'a':
        case 'A':
            game.update(DIR.LEFT, powerKey, e.key, 0);
            break;
        case 'w':
        case 'W':
            game.update(DIR.UP, powerKey, e.key, 0);
            break;
        case 'd':
        case 'D':
            game.update(DIR.RIGHT, powerKey, e.key, 0);
            break;
        case 's':
        case 'S':
            game.update(DIR.DOWN, powerKey, e.key, 0);
            break;
        case 'e':
        case ' ':
            game.update(DIR.WAIT, false, e.key, 0);
            break;
        case 'q':
        case 'Shift':
            powerKey = true;
            game.draw();
            break;
        case 'ArrowLeft':
            game.update(DIR.LEFT, powerKey, e.key, 1);
            break;
        case 'ArrowUp':
            game.update(DIR.UP, powerKey, e.key, 1);
            break;
        case 'ArrowRight':
            game.update(DIR.RIGHT, powerKey, e.key, 1);
            break;
        case 'ArrowDown':
            game.update(DIR.DOWN, powerKey, e.key, 1);
            break;
        case '0':
            game.update(DIR.WAIT, false, e.key, 1);
            break;
        default:
    }
};

let keyUpListener = function (e) {
    //prevent browser scrolling
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control'].indexOf(e.key) > -1) {
        e.preventDefault()
    }
    switch (e.key) {
        case 'q':
        case 'Shift':
            powerKey = false;
            game.draw();
            break;
        default:
    }
};

function dpadInput(key) {
    switch (key) {
        case 'PadLeft':
            game.update(DIR.LEFT, powerKey, key);
            powerKey = false;
            break;
        case 'PadUp':
            game.update(DIR.UP, powerKey, key);
            powerKey = false;
            break;
        case 'PadRight':
            game.update(DIR.RIGHT, powerKey, key);
            powerKey = false;
            break;
        case 'PadDown':
            game.update(DIR.DOWN, powerKey, key);
            powerKey = false;
            break;
        case 'PadWait':
            game.update(DIR.WAIT, powerKey, key);
            powerKey = false;
            break;
        case 'PadAttack':
            powerKey = true;
            game.draw();
            break;
        default:
    }
}

let clickDownListener = function (e) {
    game.playerAuto(Pos.getPosFromClick(e, game))
};



function addHighscore() {
    const person = prompt(
        'Congratulations, you lose! Enter your name to save your score:'
    );
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
    for (let i = 0; i < game.sheeps.length; i++) {
        let sheep = game.sheeps[i];
        sheep.eaten = true;
        sheep.rooted = true;
        game.sheepCount--;
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
    MOVE_DELAY = 0;
    game.initialiseGame(seed);
    replayLoop(moves.length, 500, function (i) {
        let ctrl = moves[i].toUpperCase() === moves[i];
        switch (moves[i].toUpperCase()) {
            case 'ARROWLEFT':
            case 'A':
                game.update(game.players[0].pos.getLeftPos(), ctrl, moves[i]);
                break;
            case 'ARROWUP':
            case 'W':
                game.update(game.players[0].pos.getUpPos(), ctrl, moves[i]);
                break;
            case 'ARROWRIGHT':
            case 'D':
                game.update(game.players[0].pos.getRightPos(), ctrl, moves[i]);
                break;
            case 'ARROWDOWN':
            case 'S':
                game.update(game.players[0].pos.getDownPos(), ctrl, moves[i]);
                break;
            case ' ':
                game.update(game.players[0].pos, ctrl, moves[i]);
                break;
            default:
        }
    });
    MOVE_DELAY = 10
}

function replayLoop(i, timeout, func) {
    if (--i < 0) {
        return
    }
    setTimeout(function () {
        func(i);
        replayLoop(i, timeout, func)
    }, timeout)
}

function testPowerSpread() {
    let ass = 0;
    let push = 0;
    let speed = 0;
    let hide = 0;
    for (let i = 0; i < 10000; i++) {
        let powerUp = PowerUp.getRandomBurst();
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
    console.log(ass);
    console.log(push);
    console.log(speed);
    console.log(hide)
}