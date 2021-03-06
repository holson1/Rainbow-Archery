function collisionHandler(shot, orb) {
    if (shot.active && orb.active) {

        var pointsToAdd = Math.floor(game.POP_POINTS * (1 + (game.LEVEL_UP_MULTIPLIER * (game.level - 1))));

        // critical hit
        if ((orb.y + (orb.height / 2) - 8 <= shot.y && shot.y <= orb.y + (orb.height / 2)) || shot.critical)  {
            shot.critical = true;
            shot.body.velocity.x = 100;
            orb.body.velocity.x = 50;
            orb.body.velocity.y = 0;
            if (! crit.isPlaying) {
                crit.play();
            }
            game.stage.backgroundColor = orb.tint;
            game.multiplier++;
            game.hexMultiplier += .25;
            pointsToAdd = pointsToAdd * game.multiplier;


            setTimeout(function() {
                    shot.destroy();
                    orb.animations.play('pop');
                    game.stage.backgroundColor = 0x000000;
                    game.multiplier = 1;
                    game.hexMultiplier = 1;
            }, 400);
        }
        // normal hit
        else {
            shot.active = false;
            orb.body.velocity.y = 0;
            shot.body.velocity.x = 100;
            setTimeout(function() {
                shot.destroy();
            }, 10);
            pop.play();
            orb.animations.play('pop');
        }

        orb.active = false;
        scoreboard.animations.play('flush');

        // TODO: implement critical combo system
        // TODO: make this a function
        // strip rgb values
        var hexStr = ("000000" + (+orb.tint).toString(16)).slice(-6);
        var hexArr = [hexStr.substring(0, 2),
                        hexStr.substring(2, 4),
                        hexStr.substring(4)]


        for (let i = 0; i < batteries.children.length; i++) {
            var convertedVal = parseInt("0x" + hexArr[i]);
            convertedVal *= game.hexMultiplier;
            batteries.children[i].val += convertedVal;
        }

        game.score += pointsToAdd;
    }
};

function bowDrawn(player, animation) {
    player.ready = true;
};

// handle shooting
// player.shoot
function shoot(shots) {
    this.animations.play('shoot');

    if (this.ready) {
        // draw the shot - ideally when the animation ends
        var y = (this.height / 2) + this.y - 4;
        fire.play();
        createShot(y, shots);
        if (batteries) {
            for (let i = 0; i < batteries.children.length; i++) {
                batteries.children[i].val -=game.SHOT_COST;
            }
        }   
        this.ready = false;
    }
};

// create a new shot
function createShot(y, shots) {
    var shot = shots.create(0, y, 'shot', 0);
    shot.active = true;
    shot.critical = false;
    shot.body.velocity.x = 7000;
    shot.checkWorldBounds = true;
    shot.events.onOutOfBounds.add(onShotOOB, this);
};

// spawn a new random orb
// orbs.spawnOrb
function spawnOrb() {
    var rand_nums = Array.from({length: 4}, () => Math.random());
    // [0] -> x pos
    // [1] -> y velocity
    // [2] -> tint/alpha
    // [3] -> scale


    var orb = this.create(400 + (rand_nums[0] * 540), game.world.borderHeight, 'orb', 0);
    orb.body.setCircle(24, 23, 22);

    var pattern = patterns[game.level % patterns.length];
    var levelFactor = Math.floor(game.level / patterns.length) * 80;
    var levelFactorX = pattern.xVMin === 0 ? 0 : levelFactor;
    var levelFactorY = pattern.yVMin === 0 ? 0 : levelFactor;
    orb.body.velocity.x =
        Math.min((rand_nums[1] * pattern.xVMin - levelFactorX), pattern.xVMax - levelFactorX);
    orb.body.velocity.y =
        Math.min((rand_nums[1] * pattern.yVMin) - levelFactorY, pattern.yVMax - levelFactorY);
    orb.body.acceleration.x = pattern.xA;
    orb.body.acceleration.y = pattern.yA;
    this.spawnClock = pattern.spawnClock;

    
    // scale the orb to a random value
    var scale = Math.max(rand_nums[3] * 1.3, 1);
    orb.scale.setTo(scale, scale);

    orb.tint = Math.floor(rand_nums[2] * 0xffffff);
    orb.alpha = Math.max(rand_nums[2], 0.5);
    var anim = orb.animations.add('pop', [1, 2, 3, 4, 5], 30, false);
    anim.onComplete.add(destroySprite, this);

    orb.checkWorldBounds = true;
    // TODO: orb missed function
    orb.events.onOutOfBounds.add(function() {
        for (let i = 0; i < batteries.children.length; i++) {
            batteries.children[i].val -= game.ORB_COST;
        }
    }, this);
    orb.events.onOutOfBounds.add(destroySprite, this);

    orb.active = true;
};

// standard destroy function
function destroySprite(sprite) {
    sprite.destroy();
};

function onShotOOB(sprite) {
    // detract score
    if (batteries) {
        for (let i = 0; i < batteries.children.length; i++) {
            batteries.children[i].val -=game.SHOT_MISS_COST;
        }
    }
    destroySprite(sprite);
};

// update the player position to match the mouse
function updatePosition(player) {
    var pos = game.input.activePointer.position;

    // bottom bound
    if (pos.y > game.world.borderHeight - (player.height / 2)) {
        player.y = game.world.borderHeight - player.height;
    }
    // top bound
    else if (pos.y < player.height / 2) {
        player.y = 0;
    }
    // otherwise
    else {
        player.y = pos.y - (player.height / 2);
    }
}

// update the scoreboard
function updateScoreboard(scoreboard) {
    var combo = game.multiplier - 1;
    var scoreText = game.score + " lvl: " + game.level;
    // if (combo > 1) {
    //     scoreText += " " + combo + " COMBO!!";
    // }
    scoreboard.text.setText(scoreText);
}