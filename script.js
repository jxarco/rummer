'use strict';

const MIN_PLAYER_COUNT = 2;
const MAX_PLAYER_COUNT = 6;
const DEFAULT_PLAYER_COUNT = 2;

const MIN_PLAYER_TIME = 1;
const MAX_PLAYER_TIME = 10;
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
        this.startGameElement = document.querySelector( "#startButton" );
        this.pauseGameElement = document.querySelector( "#pauseButton" );
        this.finishGameElement = document.querySelector( "#finishButton" );
        this.restartGameElement = document.querySelector( "#restartButton" );
        this.timerElement = document.querySelector( "#timer" );

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

        this.shouldStop = false;
        this.playersLeft = this.playerCount;
        this.lastTime = 0;

        // Set players
        for( let i = 0; i < this.playerCount; ++i )
        {
            const playerElement = this.playerInputsElement.children[ i ].querySelector( "input" );
            const playerName = playerElement.value;

            if( playerName == "" )
            {
                console.log(`Player ${ i + 1 } name is empty!`);
                this.players.length = 0;
                return;
            }

            this.players.push( new Player( i, playerElement.value, this.playerTime * 60 ) )
        }

        this.hide( this.preGameScreen );
        this.hide( this.postGameScreen );
        this.show( this.gameScreen );

        this.setPlayerTurn( 0 );

        console.log("Game started...");

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

        this.currentPlayer = this.players[ id ];
        this.titleElement.innerText = this.currentPlayer.name;
    },

    deletePlayer: function( id ) {

        const idx = this.players.findIndex( p => p.id == id );
        this.players.splice( idx, 1 );
        this.playersLeft--;

        if( this.playersLeft == 1 )
        {
            const winnerName = this.players[ 0 ].name;
            this.finishGame();
            this.toPostGameScreen( winnerName );
            return;
        }

        this.nextTurn( id - 1 )
    },

    nextTurn: function( id ) {

        const currentId = id ?? this.currentPlayer.id;
        const newId = (currentId + 1) % this.playersLeft;
        this.setPlayerTurn( newId );
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


        // 12 -> 3
        // 4  -> 8

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