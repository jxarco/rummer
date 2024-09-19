'use strict';

const MIN_PLAYER_COUNT = 2;
const MAX_PLAYER_COUNT = 6;
const DEFAULT_PLAYER_COUNT = 2;

const MIN_PLAYER_TIME = 2;
const MAX_PLAYER_TIME = 12;
const DEFAULT_PLAYER_TIME = 8; // minutes

const DEFAULT_TITLE = "RUMMER";

class Player {

    constructor( id, name, time ) {
        this.id = id ?? -1;
        this.name = name ?? "";
        this.time = time ?? 0;
    }

};

var app = {

    playerCount: DEFAULT_PLAYER_COUNT,
    playerTime: DEFAULT_PLAYER_TIME,
    playersLeft: -1,

    currentPlayer: null,
    players: [],
    shouldStop: false,
    gamePaused: false,
    lastTime: 0.0,

    startApp: function() {

        this.titleElement = document.querySelector( "#title" );
        this.titleElement.innerText = DEFAULT_TITLE;

        this.preGameScreen = document.querySelector( "#preGameScreen" );
        this.gameScreen = document.querySelector( "#gameScreen" );
        this.postGameScreen = document.querySelector( "#postGameScreen" );
        this.winnerNameElement = document.querySelector( "#winnerName" );
        this.playerInputsElement = document.querySelector( "#players" );

        this.playerCountElement = document.querySelector( "#playerCount" );
        this.playerCountElement.innerText = this.playerCount;

        this.playerTimeElement = document.querySelector( "#playerTime" );
        this.nextTurnLabelElement = document.querySelector( "#nextTurnLabel" );
        this.nextTurnTimerElement = document.querySelector( "#nextTurnTimer" );
        this.startGameElement = document.querySelector( "#startButton" );
        this.pauseGameElement = document.querySelector( "#pauseButton" );
        this.finishGameElement = document.querySelector( "#finishButton" );
        this.restartGameElement = document.querySelector( "#restartButton" );
        this.timerElement = document.querySelector( "#mainTimer" );

        this.playerCountElement.addEventListener( 'mousedown', e => {
            const rect = this.playerCountElement.getBoundingClientRect();
            const localX = (e.clientX - rect.x)|0;
            const halfWidth = rect.width * 0.5;

            this.playerCount += (localX > halfWidth ? 1 : -1);
            this.playerCount = Math.max(Math.min(this.playerCount, MAX_PLAYER_COUNT), MIN_PLAYER_COUNT);
            this.playerCountElement.innerText = this.playerCount;

            this.updatePlayers();
        });

        this.playerTimeElement.addEventListener( 'mousedown', e => {
            const rect = this.playerTimeElement.getBoundingClientRect();
            const localX = (e.clientX - rect.x)|0;
            const halfWidth = rect.width * 0.5;
            
            this.playerTime += (localX > halfWidth ? 1 : -1);
            this.playerTime = Math.max(Math.min(this.playerTime, MAX_PLAYER_TIME), MIN_PLAYER_TIME);
            this.playerTimeElement.innerText = this.playerTime + " min";
        });

        this.startGameElement.addEventListener( 'mousedown', e => {
            this.startGame();
        });

        this.pauseGameElement.addEventListener( 'mousedown', e => {
            this.pauseGame();
        });

        this.finishGameElement.addEventListener( 'mousedown', e => {
            this.finishGame();
            this.toPreGameScreen();
        });

        this.restartGameElement.addEventListener( 'mousedown', e => {
            this.toPreGameScreen();
        });

        this.timerElement.addEventListener( 'mousedown', e => {
            this.nextTurn();
        });

        // Set keydown events
        {
            const inputs = this.playerInputsElement.querySelectorAll( ".inputName" );
            inputs.forEach(element => {
                element.addEventListener( "keydown", function(e) {
                    this.classList.remove( "error" );
                } );
            });
        }

        if( localStorage.getItem( "playerNames" ) )
        {
            this.playerCount = 0;

            const names = JSON.parse( localStorage["playerNames"] );

            for( let i = 0; i < names.length; ++i )
            {
                const name = names[ i ];
                const element = this.playerInputsElement.children[ i ];

                if( name == "" )
                {
                    element.classList.add( "hidden" );
                }
                else
                {
                    element.classList.remove( "hidden" );
                    element.querySelector( "input" ).value = name;
                    this.playerCount++;
                }
            }

            this.playerCountElement.innerText = this.playerCount;
        }

        if( localStorage.getItem( "playerTime" ) )
        {
            this.playerTime = +localStorage["playerTime"];
            this.playerTimeElement.innerText = this.playerTime + " min";
        }
    },

    updatePlayers: function() {

        for( let i = 1; i <= MAX_PLAYER_COUNT; ++i )
        {
            let element = this.playerInputsElement.children[ i - 1 ];

            if( i > this.playerCount )
            {
                if( !element.classList.contains( "hidden" ) )
                {
                    element.querySelector( "input" ).value = "";
                    element.classList.add( "hidden" );
                }
            }
            else
            {
                element.classList.remove( "hidden" );
            }
        }
    },

    startGame: function() {

        // Check repetitions
        const inputs = this.playerInputsElement.querySelectorAll( ".inputName" );
        const names = Array.from( inputs ).map( i => i.value );

        let error = false;

        for( let i = 0; i < this.playerCount; ++i )
        {
            const playerName = names[ i ];
            if( playerName == "" )
            {
                console.log(`Player ${ i + 1 } name is empty!`);
                inputs[ i ].classList.add( "error" );
                error = true;
                continue;
            }

            if( playerName.length < 3 )
            {
                console.log(`Player ${ i + 1 } name [${ playerName }] is too short. Use 3 or more characters!`);
                inputs[ i ].classList.add( "error" );
                error = true;
                continue;
            }

            const repeats = names.reduce( (acc, value) => { if( value == playerName ) return acc + 1; else return acc }, 0 );
            if( repeats > 1 )
            {
                console.log(`Player name ${ playerName } is being used ${ repeats } times!`);
                inputs[ i ].classList.add( "error" );
                error = true;
            }
        }

        if( error )
        {
            return;
        }

        // Set players

        this.players.length = 0;

        for( let i = 0; i < this.playerCount; ++i )
        {
            this.players.push( new Player( i, names[ i ], this.playerTime * 60 ) )
        }

        this.shouldStop = false;
        this.playersLeft = this.playerCount;
        this.lastTime = 0;

        this.hide( this.preGameScreen );
        this.hide( this.postGameScreen );
        this.show( this.gameScreen );

        this.setPlayerTurn( 0 );

        console.log("Game started...");

        // Cache names for next game
        localStorage[ "playerNames" ] = JSON.stringify( names );
        localStorage[ "playerTime" ] = this.playerTime;

        // Start loop
        requestAnimationFrame( this.loop.bind( this ) );
    },

    loop: function() {

        if( this.shouldStop )
        {
            return;
        }

        const now = performance.now();
        this.lastTime = (this.lastTime == 0.0 ? now : this.lastTime);
        const dt = (now - this.lastTime) * 0.001;

        this.currentPlayer.time = Math.max( this.currentPlayer.time - dt, 0 );
        const seconds = this.currentPlayer.time|0;

        if( seconds == 0 )
        {
            this.deletePlayer( this.currentPlayer.id );
            this.pauseGame();
        }

        this.timerElement.innerText = this.convertSeconds( seconds );

        this.lastTime = now;

        requestAnimationFrame( this.loop.bind( this ) );
    },

    pauseGame: function() {

        if( this.gamePaused )
        {
            this.shouldStop = this.gamePaused = false;
            this.lastTime = 0;
            this.timerElement.classList.remove( "paused" );
            this.pauseGameElement.innerHTML = "Pause⏸️";
            console.log("Game restarted...");
            requestAnimationFrame( this.loop.bind( this ) );
        }
        else
        {
            this.timerElement.classList.add( "paused" );
            this.shouldStop = this.gamePaused = true;
            this.pauseGameElement.innerHTML = "Resume▶️";
            console.log("Game paused...");
        }
    },

    finishGame: function() {

        this.shouldStop = true;
        this.gamePaused = false;
        this.players.length = 0;
        this.lastTime = 0;
        this.currentPlayer = null;
        this.playersLeft = -1;

        console.log("Game finished...");
    },

    setPlayerTurn: function( id ) {

        // Main timer
        this.currentPlayer = this.getPlayer( id );
        this.titleElement.innerText = this.currentPlayer.name;

        // Secondary timer
        const nextPlayer = this.getNextPlayer();
        this.nextTurnLabelElement.innerHTML = "➡️" + nextPlayer.name;
        this.nextTurnTimerElement.innerText = this.convertSeconds( nextPlayer.time|0 );
    },

    getPlayer: function( id ) {

        const idx = this.players.findIndex( p => p.id == id );
        return this.players[ idx ];
    },

    getNextPlayer: function( id ) {

        id = id ?? this.currentPlayer.id;
        const newId = (id + 1) % this.playersLeft;
        return this.players[ newId ];
    },

    deletePlayer: function( id ) {

        this.nextTurn();

        // Delete player

        const idx = this.players.findIndex( p => p.id == id );
        this.players.splice( idx, 1 );
        this.playersLeft--;

        if( this.playersLeft == 1 )
        {
            const winnerName = this.players[ 0 ].name;
            this.finishGame();
            this.toPostGameScreen( winnerName );
        }
    },

    nextTurn: function( id ) {

        const nextPlayer = this.getNextPlayer( id );
        this.setPlayerTurn( nextPlayer.id );
    },

    toPreGameScreen: function() {

        this.hide( this.gameScreen );
        this.hide( this.postGameScreen );
        this.show( this.preGameScreen );

        this.titleElement.innerText = DEFAULT_TITLE;
    },

    toPostGameScreen: function( winnerName ) {

        this.hide( this.gameScreen );
        this.hide( this.preGameScreen );
        this.show( this.postGameScreen );

        this.titleElement.innerHTML = "WINNER";
        this.winnerNameElement.innerHTML = winnerName;

        this.winnerNameElement.style.fontSize = (40.0 / winnerName.length)  + "em";
    },

    hide: function( element ) {

        element.classList.add( "hidden" );
    },

    show: function( element ) {

        element.classList.remove( "hidden" );
    },

    convertSeconds: function( seconds ) {

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${minutes}:${formattedSeconds}`;
    }
};