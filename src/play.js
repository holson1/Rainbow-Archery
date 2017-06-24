var playState = {
    create: function() {
        game.world.borderHeight = 550;

        // Initialize the scoring
        game.score = 0;
        game.level = 1;
        game.POP_POINTS = 10;
        game.multiplier = 1;
        game.hexMultiplier = 1;
        game.SHOT_COST = 100;
        game.ORB_COST = 10;

        // draw the score area
        scoreboard = game.add.sprite(0, 550, 'scoreboard', 0);

        // batteries object holds information on each battery
        batteries = game.add.group();
        batteries.HEIGHT = 555;
        batteries.START_VAL = 1000;
        batteries.FULL_VAL = 2000;
        batteries.MAX_VAL = 2300;

        battery_config = [
            {'tint': 0xff0000, 'x': 515},
            {'tint': 0x00ff00, 'x': 665},
            {'tint': 0x0000ff, 'x': 815},
        ]

        for (let i=0; i < battery_config.length; i++) {
            let battery = batteries.create(battery_config[i].x, batteries.HEIGHT, 'battery', 0);
            battery.defaultTint = battery.tint = battery_config[i].tint;
            battery.val = batteries.START_VAL;
        }

        scoreboard.animations.add('flush', [1, 2, 3, 4, 5, 6, 7, 0], 30, false);
        scoreboard.text = game.add.text(100, 563, "000000", {
            font: "25px Courier",
            fill: "#ffffff",
            align: "left"
        });

        // The player and its settings
        player = game.add.sprite(0, (game.world.borderHeight / 2), 'bow', 0);
        player.ready = false;
        player.shoot = shoot;

        //  We're going to be using physics, so enable the Arcade Physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  We need to enable physics on the player
        game.physics.arcade.enable(player);

        // player animations
        drawAnim = player.animations.add('draw', [0, 1, 2, 3, 4, 5, 6, 7], 30, false);
        drawAnim.onComplete.add(bowDrawn, this);
        player.animations.add('shoot', [11, 12, 13], 30, false);

        // set up shots
        shots = game.add.group();
        shots.enableBody = true;
        shots.physicsBodyType = Phaser.Physics.ARCADE;

        // set up orbs 
        orbs = game.add.group();
        orbs.enableBody = true;
        orbs.physicsBodyType = Phaser.Physics.ARCADE;
        orbs.spawnClock = 30;
        orbs.spawnOrb = spawnOrb;

        /*
        SOUND REGISTRATION
        */

        // TODO: add a sound manager object here

        pop = game.add.audio('pop');
        crit = game.add.audio('crit');
        draw = game.add.audio('draw');
        fire = game.add.audio('fire');
        levelup = game.add.audio('levelup');
        gameover = game.add.audio('gameover');

        // music
        mainTheme = game.add.audio('mainTheme')
        mainTheme.addMarker('intro', 0, 40.425);
        mainTheme.addMarker('loop', 40.425, 103.575, 1, true);

        // TODO: allow user to disable music
        mainTheme.play('intro');

        // play the loop only after the intro
        mainTheme.onStop.add(function() {
            if (mainTheme.currentMarker !== 'loop') {
                mainTheme.play('loop');
            }
        }, this);
        
        // EVENT HANDLERS
        // left mouse button pressed
        game.input.activePointer.leftButton.onDown.add(function() {
            player.animations.play('draw');
            // this is a sound - could use sound manager obj here
            draw.play();
        }, this);


        // left mouse button released
        game.input.activePointer.leftButton.onUp.add(function() {
            player.animations.play('shoot');
            if (player.ready) {
                player.shoot(shots);      
            }
            
        }, this);
    }, 

    update: function() {

        // PLAYER POSITION
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

        // check to see if an arrow collides with an orb
        game.physics.arcade.overlap(shots, orbs, collisionHandler, null, this);

        // create an orb
        if (orbs.spawnClock == 0) {
            orbs.spawnOrb();
        }
        else {
            orbs.spawnClock--;
        }

        // check battery levels
        var gameOver = false;
        var canLevelUp = true;
        var scaleConstant = batteries.FULL_VAL / 9;

        for (let i = 0; i < batteries.children.length; i++) {
            let battery = batteries.children[i];
            
            if (battery.val <= 0) {
                gameOver = true;
            }

            if (battery.val > batteries.MAX_VAL) {
                battery.val = batteries.MAX_VAL;
            }

            if (battery.val >= batteries.FULL_VAL) {
                battery.frame = 8;
                battery.tint = (battery.tint == '0xffffff' ? battery.defaultTint : '0xffffff');
            }
            else {
                battery.frame = Math.floor(battery.val / scaleConstant);
                battery.tint = battery.defaultTint;
                canLevelUp = false;
            }
        }

        // GAME OVER
        if (gameOver) {
            gameover.play();
            mainTheme.pause();
            game.state.start('gameover');
        }

        // LEVEL UP
        if (canLevelUp) {
            levelup.play();
            game.level++;

            for (let i = 0; i < batteries.children.length; i++) {
                batteries.children[i].val = batteries.START_VAL;
                batteries.children[i].tint = batteries.children[i].defaultTint;
            }
        }

        // ensures the score board stays at the top
        game.world.bringToTop(scoreboard);
        game.world.bringToTop(batteries);

        // update the scoreboard
        // TODO: make this a function
        var combo = game.multiplier - 1;
        var scoreText = game.score + " lvl: " + game.level;
        if (combo > 1) {
            scoreText += " " + combo + " COMBO!!";
        }
        scoreboard.text.setText(scoreText);
    },

    // debugging stuff
    render: function() {
        // enable debug
        
        /*
        game.debug.body(player);

        for (let orb of orbs.children) {
            game.debug.body(orb);
        }
        */
    },
};