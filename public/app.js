
;
jQuery(function($){    
    'use strict';

    var Config = {}

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, onPlayerJoinedRoom: Function, onBeginNewGame: Function, onNewQuestion: Function, onPloysList: Function, onHostCheckAnswer: Function, onHostSavePloy: Function, onGameOver: Function, onError: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.onPlayerJoinedRoom );
            IO.socket.on('beginNewGame', IO.onBeginNewGame );
            IO.socket.on('newQuestion', IO.onNewQuestion);
            IO.socket.on('ploysList', IO.onPloysList);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('hostSavePloy', IO.hostSavePloy);
            IO.socket.on('hostLaunchGame', IO.hostLaunchGame);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('err', IO.error );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.sessionId = IO.socket.id;

            console.log("Successfully connected. Session ID : " + App.sessionId);
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, sessionId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, playerId: int}}
         */
        onPlayerJoinedRoom : function(data) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.

            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.role].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        onBeginNewGame : function(data) {
            App[App.role].gameCountdown(data);
        },

        /**
         * A new set of words for the round is returned from the server.
         * @param data
         */
        onNewQuestion : function(data) {
            // Update the current round
            App.currentRound = data.round;

            // Change the word for the Host and Player
            App[App.role].newQuestion(data);
        },

        /**
         * XXXXXXXXXXXXXXXXXXXX
         * @param data
         */
        onPloysList : function(data) {
            // XXXXXXXXXXXXX
            App[App.role].ploysList(data);
        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param data
         */
        onHostCheckAnswer : function(data) {
            if(App.role === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        /**
         * A player sent ploy. If this is the host, save the answer.
         * @param data
         */
        onHostSavePloy : function(data) {
            if(App.role === 'Host') {
                App.Host.savePloy(data);
            }
        },

        hostLaunchGame : function(data) {
            if(App.myRole === 'Host') {
                App.Host.launchGame(data);
            }
        },

        /**
         * Let everyone know the game has ended.
         * @param data
         */
        onGameOver : function(data) {
            App[App.role].endGame(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        onError : function(data) {
            alert(data.message);
        }

    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        role: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        sessionId: '',

        /**
         * Identifies the current round.
         */
        currentRound: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);
            App.$gameArea = $('#gameArea');

            // Templates
            App.$introScreenTemplate = $('#intro-screen-template').html();
            App.$newGameTemplate = $('#create-game-template').html();
            App.$joinGameTemplate = $('#join-game-template').html();
            App.$hostGameTemplate = $('#host-game-template').html();
            App.$playerInfoTemplate = $('#player-info-template').html();
            App.$ployTemplate = $('#ploy-template').html();
            App.$waitScreenTemplate = $('#wait-screen-template').html();
            App.$playerAnswerTemplate = $('#player-answer-template').html();
            App.$playerVoteTemplate = $('#player-vote-template').html();
            App.$restartScreenTemplate = $('#restart-screen-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '#btnSendPloy',App.Player.onPlayerSendPloyClick);
            // App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
            App.$doc.on('click', '#btnPlayerLaunchGame', App.Player.onPlayerLaunchGameClick);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Fibbage Tribute Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$introScreenTemplate);
            App.doTextFit('.title');
        },


        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : {},

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * Keep track of the number of ploys that have been sent to the game.
             */
            nbPloys: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
                // console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, sessionId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.sessionId = data.sessionId;
                App.role = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.sessionId);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.Host.showTemplateNewGame();
                // App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                //App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            showTemplateNewGame : function() {
                App.$gameArea.html(App.$templateNewGame);

                var $flags = $('#flags');
                Object.keys(Config.languages).forEach(code => {
                    var $flag = $('<img src="images/flags/' + Config.languages[code].flag_path + '">');
                    $flag.addClass('flag');
                    $flag.click(function(){
                        App.Host.selectFlag(this, code);
                    });
                    $flags.append($flag);
                });

                $('.flag')[0].click();
            },

            selectFlag : function($flag, code) {
                App.language = code;
                console.log(code);
                $('.flag').removeClass('selectedFlag');
                $($flag).addClass('selectedFlag');
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string, gameId: int, playerId: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                // Store the new player's data on the Host.
                App.Host.players[data.playerId] = data;

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;
            },

            launchGame : function(data) {
                IO.socket.emit('hostRoomFull', {gameId: App.gameId, language: App.language});
            },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGameTemplate);
                App.doTextFit('#hostWord');

                // Begin the on-screen countdown timer
                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, Config.pregameCountdownDuration, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });

                Object.keys(App.Host.players).forEach(function(key){
                    const player = App.Host.players[key];

                    const $playerInfo = $(App.$playerInfoTemplate).appendTo('#playerInfos');

                    $playerInfo
                        .find('.playerName')
                        .html(player.playerName);
                    player.$playerScore = $playerInfo.find('.playerScore');
                    player.playerScore = 0;
                });
            },

            /**
             * Show the word for the current round on screen.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newQuestion : function(data) {
                // Insert the new word into the DOM
                $('#hostWord').text(data.question);
                App.doTextFit('#hostWord');

                $('#playersAnswersArea').empty();

                // Update the data for the current round
                App.Host.currentQuestion = data.question;
                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
                App.Host.nbPloys = 0;
                App.Host.answers = {};
                App.Host.nbAnswers = 0;
            },

            /**
             * Check the answer clicked by a player.
             * @param data{{round: *, playerId: *, answer: *, gameId: *}}
             */
            checkAnswer : function(data) {
                // Verify that the answer clicked is from the current round.
                // This prevents a 'late entry' from a player whos screen has not
                // yet updated to the current round.
                if (data.round === App.currentRound){
                    App.Host.answers[data.playerId] = data.answer;
                    App.Host.nbAnswers += 1;

                    console.log("checkAnswer", data);
                    console.log("App.Host.answers", App.Host.answers);

                    // If all players answered
                    if (App.Host.nbAnswers === Object.keys(App.Host.players).length) {
                        console.log('All players answered.');

                        App.Host.displayAnswers();
                        App.Host.updateScore();

                        // Advance the round
                        App.currentRound += 1;

                        // Prepare data to send to the server
                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        // Notify the server to start the next round.
                        setTimeout(function(){
                            IO.socket.emit('hostNextRound', data);
                        }, Config.answerDisplayCountdownDuration * 1000);
                    }
                }
            },

            displayAnswers : function() {
                Object.keys(App.Host.answers).forEach(function(playerAnsweringId){
                    var answer = App.Host.answers[playerAnsweringId];
                    
                    var $curPlayerVote = $(App.$playerVoteTemplate);
                    // console.log(playerAnsweringId);
                    $curPlayerVote.find(".playerName").html(App.Host.players[playerAnsweringId].playerName);
                    // console.log($curPlayerVote);
                    // console.log($curPlayerVote.find('.playerVote'));

                    if(answer.playerId == "answer"){
                        $curPlayerVote.find(".bonus").html("+" + Config.goodAnswer);
                        $curPlayerVote.find(".malus").remove();
                    } else {
                        $curPlayerVote.find(".bonus").remove();
                        $curPlayerVote.find(".malus").html("+" + Config.ployAnswer);
                    }

                    var $curPlayerAnswer;
                    if(App.Host.players[answer.playerId])
                        $curPlayerAnswer = App.Host.players[answer.playerId].$playerAnswer;
                    else
                        $curPlayerAnswer = App.Host.$trueAnswer;
                    var $playersVotesArea = $curPlayerAnswer.find('.playersVotesArea');
                    $playersVotesArea.append($curPlayerVote);
                });
            },

            updateScore : function() {
                Object.keys(App.Host.answers).forEach(function(playerAnsweringId){
                    var answer = App.Host.answers[playerAnsweringId];
                    if(answer.playerId == 'answer'){
                        var $pScore = App.Host.players[playerAnsweringId].$playerScore;
                        
                        App.Host.players[playerAnsweringId].playerScore += Config.goodAnswer;
                        $pScore.text( App.Host.players[playerAnsweringId].playerScore );
                    } else {
                        var $pScore = App.Host.players[answer.playerId].$playerScore;
                        
                        App.Host.players[answer.playerId].playerScore += Config.ployAnswer;
                        $pScore.text( App.Host.players[answer.playerId].playerScore );
                    }
                });
            },

            /**
             * Save the ploy sent by a player.
             * @param data{{round: *, playerId: *, ploy: *, gameId: *}}
             */
            savePloy : function(data) {
                // Verify that the ploy sent is from the current round.
                // This prevents a 'late entry' from a player whos screen has not
                // yet updated to the current round.
                if (data.round === App.currentRound){
                    // Update host screen
                    /*
                    $('#playersWaiting')
                        .append('<p/>')
                        .text('Player ' + data.playerName + ' sent his ploy.');
                    */

                    // Store the new player's data on the Host.
                    App.Host.players[data.playerId].ploy = data.ploy;

                    console.log("Ploy sent", App.Host.players);

                    // Increment the number of players in the room
                    App.Host.nbPloys += 1;

                    console.log("wesh", "App.Host.nbPloys = " + App.Host.nbPloys + " / Object.keys(App.Host.players).length = " + Object.keys(App.Host.players).length);

                    // If two players have joined, start the game!
                    if (App.Host.nbPloys === Object.keys(App.Host.players).length) {
                        console.log('Ploys all sent.');
                        
                        var newData = {
                            round: data.round,
                            gameId: data.gameId,
                            question: App.Host.currentQuestion,
                            answer: App.Host.currentCorrectAnswer,
                            ploys: []
                        };

                        Object.keys(App.Host.players).forEach(function(key){
                            newData.ploys.push({
                                playerId: key,
                                value: App.Host.players[key].ploy,
                            });
                        });

                        console.log("newData", newData);

                        // Let the server know that all the ploys have been sent.
                        IO.socket.emit('allPloysSent', newData);
                    }
                }
            },

            /**
             * Show the word for the current round on screen.
             * @param data{{round: *, gameId: *, question: *, answer: *, ploys: Array, list: Array}}
             */
            ploysList : function(data) {
                console.log(data.list);

                $.each(data.list, function(){
                    /*
                    var $answer = $('<div>')
                        .addClass('answer')
                        .html(this.value);
                    
                    $('#playersAnswersArea').append($answer);
                    */
                    var $curPlayerAnswer = $(App.$playerAnswerTemplate);
                    $curPlayerAnswer.find('.answer').html(this.value.toUpperCase());
                    $('#playersAnswersArea').append($curPlayerAnswer);

                    console.log(App.Host.players);
                    console.log(this.playerId);
                    console.log(this);

                    if(!App.Host.players[this.playerId])
                        App.Host.$trueAnswer = $curPlayerAnswer;
                    else
                        App.Host.players[this.playerId].$playerAnswer = $curPlayerAnswer;
                });
                
                var nbColumns;
                if(App.Host.nbPloys <= 4)
                    nbColumns = 2;
                else if(App.Host.nbPloys <= 9)
                    nbColumns = 3;
                else
                    nbColumns = 4;
                $('#playersAnswersArea').css('grid-template-columns', "1fr ".repeat(nbColumns));
                
                App.doTextFit('#hostWord');
            },

            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                var bestScore = 0;
                Object.keys(App.Host.players).forEach(function(playerId){
                    if(App.Host.players[playerId].playerScore > bestScore)
                        bestScore = App.Host.players[playerId].playerScore;
                });
                var winners = [];
                Object.keys(App.Host.players).forEach(function(playerId){
                    if(App.Host.players[playerId].playerScore == bestScore)
                        winners.push(App.Host.players[playerId].playerName);
                });

                // Display the winner (or tie game message)
                if(winners.length > 1){
                    var winnersStr = "";
                    winners.forEach(function(winner, index){
                        if(index == winners.length - 1)
                            winnersStr += "And "
                        winnersStr += winner + " ";
                    });
                    $('#hostWord').text(winnersStr + "Win !");
                } else {
                    $('#hostWord').text( winners[0] + ' Wins !' );
                }
                App.doTextFit('#hostWord');

                $('#playersAnswersArea').empty();

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
                App.Host.players = {};
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.Host.showTemplateNewGame();
                $('#spanNewGameCode').text(App.gameId);
            }
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$joinGameTemplate);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.role = 'Player';
                App.Player.myName = data.playerName;
            },

            onPlayerLaunchGameClick: function() {
                IO.socket.emit('playerLaunchGameClick', App.gameId);
            },

            /**
             * The player entered his ploy
             * and clicked validate.
             */
            onPlayerSendPloyClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId: App.gameId,
                    playerId: App.sessionId,
                    ploy: $('#inputPloy').val(),
                    round: App.currentRound
                };

                // Send the player info and written ploy to the server so
                // the host can display the ploys.
                IO.socket.emit('playerSendPloy', data);

                $('#gameArea').html(App.$waitScreenTemplate);
            },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function(event) {
                console.log("onPlayerAnswerClick", event.data);

                var data = {
                    gameId: App.gameId,
                    playerId: App.sessionId,
                    round: App.currentRound,
                    answer: event.data
                };

                IO.socket.emit('playerAnswer', data);

                $('#gameArea').html(App.$waitScreenTemplate);
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }

                console.log(App.$restartScreenTemplate);

                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                
                // $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
                $('#gameArea').html(App.$restartScreenTemplate);
            },

            /**
             * Display the waiting screen when waiting for other players
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.id === data.playerId){
                    App.role = 'Player';
                    App.gameId = data.gameId;

                    $('#btnPlayerLaunchGame').css('display', 'inline-block');
                    $('#btnStart').css('display', 'none');

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.sessionId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newQuestion : function(data) {
                $('#gameArea').html(App.$ployTemplate);
            },

            /**
             * XXXXXXXXXXXXXXXXXX
             * @param data{{round: *, gameId: *, question: *, answer: *, ploys: Array, list: Array}}
             */
            ploysList : function(data) {
                $('#gameArea').html(App.$ployTemplate);
                // Create an unordered list element
                var $list = $('<ul/>').attr('id','ulAnswers');

                // Insert a list item for each word in the word list
                // received from the server.
                $.each(data.list, function(){
                    
                    var $button = $('<button/>')
                        .addClass('btnAnswer')
                        .addClass('btn')
                        .val(this.value)
                        .html(this.value.toUpperCase())
                    if(App.sessionId == this.playerId)
                        $button.attr('disabled', 'disabled');
                    var $li = $('<li/>');
                    $li.append($button);
                    $list.append($li);

                    const data = {};

                    $button.on('click', this, App.Player.onPlayerAnswerClick);
                });

                // Insert the list onto the screen.
                $('#gameArea').html($list);
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            App.doTextFit('#hostWord');

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },

        /**
         * Make the text inside the given element as big as possible
         * See: https://github.com/STRML/textFit
         *
         * @param el The parent element of some text
         */
        doTextFit : function(el) {
            textFit($(el)[0], {
                minFontSize: 10,
                maxFontSize: 200,
                alignVert: true,
                multiLine: true
            });
            console.log(el);
        }
    };

    fetch('/config.json').then(data => data.json()).then(json => {
        Config = json;
        IO.init();
        App.init();
    });

}($));
