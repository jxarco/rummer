'use strict';

const MIN_PLAYER_COUNT = 2;
const MAX_PLAYER_COUNT = 6;
const DEFAULT_PLAYER_COUNT = 2;

const MIN_PLAYER_TIME = 1;
const MAX_PLAYER_TIME = 10;
const DEFAULT_PLAYER_TIME = 8; // minutes

class Player {

    constructor( id ) {
        this.id = id ?? -1;
        this.time = 0;
    }

};

var app = {

    playerCount: DEFAULT_PLAYER_COUNT,
    playerTime: DEFAULT_PLAYER_TIME,

    currentPlayer: -1,
    players: [],

    startApp: function() {

        this.playersElement = document.querySelector( "#players" );

        this.playerCountElement = document.querySelector( "#playerCount" );
        this.playerCountElement.innerText = this.playerCount;

        this.playerTimeElement = document.querySelector( "#timeCount" );
        this.startGameElement = document.querySelector( "#startButton" );

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
    },

    updatePlayers: function() {

        for( let i = 1; i <= MAX_PLAYER_COUNT; ++i )
        {
            let element = this.playersElement.children[ i - 1 ];

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

        console.log("Game started..")

        // Set players
        // ...

        // Start loop
        // ...

    }
};