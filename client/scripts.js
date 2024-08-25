let ws;
let playerId;
let gameId;
let displayedCards = [];
let selectedCards = [];

let gameInfo = {
    playerName: "",
    enemyName: "",
    playerPoints: 0,
    enemyPoints: 0
};

let card_model = {
    width: 100,
    height: 150
}

function supportsLocalStorage() {
    return typeof(Storage)!== 'undefined';
}
  
if (!supportsLocalStorage()) {
    console.log('supportsLocalStorage is false');
} else {
    console.log('supportsLocalStorage is true');
}

const storedData = {
    playerId: localStorage.getItem('playerId'),
    gameId: localStorage.getItem('gameId')
}

console.log('Game ID is:', storedData.playerId);
console.log('player ID is:', storedData.gameId);

if (storedData.playerId && storedData.gameId) {
    reconnectConnection(storedData.playerId, storedData.gameId)
}

const canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.9;

    drawCardsOnCanvas();
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


function connect() {
    const playerName = document.getElementById('playerName').value;

    if (!playerName) {
        alert('Please enter a player name');
        return;
    }

    const connection = {
        ConnectionType: "join",
        PlayerId: "",
        PlayerName: playerName,
        GameId: ""
    };

    ws = new WebSocket('ws://localhost:8080/ws');

    ws.onopen = function() {
        console.log('WebSocket connection opened');
        ws.send(JSON.stringify(connection));
    };

    ws.onmessage = function(event) {
        console.log('Message from server:', event.data);

        let message;
        try {
            message = JSON.parse(event.data);
            if (typeof message === 'string') {
                message = JSON.parse(message);
            }
        } catch (e) {
            console.error('Error parsing message:', e);
            return;
        }

        handleMessage(message);
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        alert('WebSocket error');
    };
}

function reconnect() {
    const playerId = document.getElementById('playerInputId').value;
    const gameId = document.getElementById('gameInputId').value;

    reconnectConnection(playerId, gameId)
}

function reconnectConnection(playerId, gameId) {
    if (!playerId || !gameId) {
        alert('Please enter a player name');
        return;
    }

    const connection = {
        ConnectionType: "reconnect",
        PlayerId: playerId,
        PlayerName: "",
        GameId: gameId
    };

    ws = new WebSocket('ws://localhost:8080/ws');

    ws.onopen = function() {
        console.log('WebSocket connection opened');
        ws.send(JSON.stringify(connection));
    };

    ws.onmessage = function(event) {
        console.log('Message from server:', event.data);

        let message;
        try {
            message = JSON.parse(event.data);
            if (typeof message === 'string') {
                message = JSON.parse(message);
            }
        } catch (e) {
            console.error('Error parsing message:', e);
            return;
        }

        handleMessage(message);
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        alert('WebSocket error');
    };

}


function handleMessage(message) {
    console.log("handleMessage", message);
    if (message.Type === "GameInfo") {
        handleGameInfo(message);
    } else if (message.Type === "GameStatus") {
        handleGameStatus(message);
    } else if (message.Type === "Cards") {
        handleCards(message.Cards);
    } else if (message.Type === "GameOverStatus") {
        handleGameOverStatus(message);
    }
}

function handleGameInfo(message) {
    playerId = message.PlayerId;
    gameId = message.GameId;

    localStorage.setItem('playerId', playerId);
    localStorage.setItem('gameId', gameId);

    gameInfo.playerName = message.PlayerName;
    gameInfo.enemyName = message.EnemyName;

    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
}

function handleGameStatus(message) {
    gameInfo.playerPoints = message.PlayerPoints;
    gameInfo.enemyPoints = message.EnemyPoints;
}

function handleCards(cards) {
    selectedCards = [];
    displayedCards = cards;
    drawCardsOnCanvas();
}

function handleGameOverStatus(message) {
    const winner = message.Winner;
    const playerPoints = message.PlayerPoints;
    const enemyPoints = message.EnemyPoints;

    // Create a result message
    let resultMessage = `Game Over!`;
    if (winner === playerId) {
        resultMessage += ` You won with ${playerPoints} points!`;
    } else if (winner === 'Draw') {
        resultMessage += ` It's a draw! You both have ${playerPoints} points.`;
    } else {
        resultMessage += ` You lost. You: ${playerPoints} points, Enemy: ${enemyPoints} points.`;
    }

    gameInfo.playerPoints = 0;
    gameInfo.enemyPoints = 0;
    drawResultFrame(resultMessage);
}

function drawCardsOnCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    displayedCards.forEach((card, index) => {
        drawCard(card, index);
    });

    drawScores()
    drawPlayButton(false)
}

function drawScores() {
    ctx.fillStyle = 'black'; 
    ctx.font = '20px Arial';

    const score = gameInfo.playerPoints + " : " + gameInfo.enemyPoints;
    const centerX = canvas.width / 2;
    const positionY = 50; 
    
    ctx.fillText(score, centerX, positionY);
}


function drawPlayButton(clicked = false) {
    const button = {
        width: 150,
        height: 40,
        x: canvas.width / 2 - 150 / 2,
        y: (canvas.height - 40) - 50,
        borderRadius: 10
    };

    ctx.beginPath();
    ctx.moveTo(button.x + button.borderRadius, button.y);
    ctx.lineTo(button.x + button.width - button.borderRadius, button.y);
    ctx.arcTo(button.x + button.width, button.y, button.x + button.width, button.y + button.borderRadius, button.borderRadius);
    ctx.lineTo(button.x + button.width, button.y + button.height - button.borderRadius);
    ctx.arcTo(button.x + button.width, button.y + button.height, button.x + button.width - button.borderRadius, button.y + button.height, button.borderRadius);
    ctx.lineTo(button.x + button.borderRadius, button.y + button.height);
    ctx.arcTo(button.x, button.y + button.height, button.x, button.y + button.height - button.borderRadius, button.borderRadius);
    ctx.lineTo(button.x, button.y + button.borderRadius);
    ctx.arcTo(button.x, button.y, button.x + button.borderRadius, button.y, button.borderRadius);
    ctx.closePath();

    // Change the color based on whether the button is clicked or not
    ctx.fillStyle = clicked ? 'green' : 'white';
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'black';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Send!', button.x + button.width / 2, button.y + button.height / 2);

    // Store the button's position and dimensions in the canvas dataset
    canvas.dataset.sendCardsButton = JSON.stringify({ x: button.x, y: button.y, width: button.width, height: button.height, active: true });
}



function getCardX(index) {
    const totalCardsWidth = 3 * card_model.width;
    const totalMargin = canvas.width - totalCardsWidth;
    const margin = totalMargin / 4;

    return margin + index * (card_model.width + margin);
}


function getCardY() {
    return (canvas.height * 0.5) - (card_model.height / 2); }

function drawCard(card, index) {
    const cardX = getCardX(index);
    console.log(cardX, card)
    const cardY = getCardY();
    const cornerRadius = 10;

    ctx.fillStyle = 'white';  
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cardX, cardY, card_model.width, card_model.height, cornerRadius);

    ctx.fillStyle = 'black';  
    ctx.font = '50px Arial';  
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let icon;
    switch(card) {
        case 1:
            icon = '✊';  
            break;
        case 2:
            icon = '✋';  
            break;
        case 3:
            icon = '✌';  
            break;
        default:
            icon = '';  
    }

    ctx.fillText(icon, cardX + card_model.width / 2, cardY + card_model.height / 2);

    const selectedIndex = selectedCards.indexOf(index);
    if (selectedIndex !== -1) {
        ctx.fillStyle = 'black'; 
        ctx.font = '20px Arial'; 
        ctx.fillText(selectedIndex + 1, cardX + card_model.width / 2, cardY + card_model.height + 20);
    }
}



function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawResultFrame(message) {
    const frameWidth = canvas.width - 40;
    const frameHeight = 130;
    const frameX = 20;
    const frameY = canvas.height - frameHeight - 20;
    const buttonWidth = 150;
    const buttonHeight = 40;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = frameY + frameHeight - buttonHeight - 10;

    ctx.clearRect(frameX, frameY, frameWidth, frameHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(frameX, frameY, frameWidth, frameHeight);

    ctx.fillStyle = 'white';  
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(message, canvas.width / 2, frameY + frameHeight / 2 - 20);

    ctx.fillStyle = 'green';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText('Play Again', canvas.width / 2, buttonY + buttonHeight / 2);

    canvas.dataset.playAgainButton = JSON.stringify({ x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, active: true });
}


canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if the click is within the "Play Again" button
    const sendCardsButton = canvas.dataset.sendCardsButton ? JSON.parse(canvas.dataset.sendCardsButton) : null;
    const playAgainButton = canvas.dataset.playAgainButton ? JSON.parse(canvas.dataset.playAgainButton) : null;
    if (isButtonClicked(playAgainButton, x, y)) {
        playAgain();
        playAgainButton.active = false
        sendCardsButton.active = false
    } else if (isButtonClicked(sendCardsButton, x, y)) {
        drawPlayButton(true);
        sendDigits();
        sendCardsButton.active = false;
    } else {
        // Check if any card was clicked
        displayedCards.forEach((card, index) => {
            const cardX = getCardX(index);
            const cardY = getCardY();

            if (x >= cardX && x <= cardX + card_model.width && y >= cardY && y <= cardY + card_model.height) {
                selectCard(index);
            }
        });
    }
});

function isButtonClicked(button, x, y) {
    console.log(button)
    return button && button.active &&
     x >= button.x && x <= button.x + button.width &&
      y >= button.y && y <= button.y + button.height
}

function selectCard(index) {
    if (selectedCards.indexOf(index) === -1 && selectedCards.length < 3) {
        selectedCards.push(index);
    } else {
        selectedCards = selectedCards.filter(cardIndex => cardIndex !== index);
    }
    drawCardsOnCanvas();
}

function sendDigits() {
    if (!ws) {
        alert('WebSocket connection is not open');
        return;
    }

    const digits = selectedCards.map(index => displayedCards[index]);
    const data = {
        Cards: digits
    };

    ws.send(JSON.stringify(data));
    console.log('Sent digits:', JSON.stringify(data));
}

function playAgain() {
    if (!ws) {
        alert('WebSocket connection is not open');
        return;
    }

    const data = {
        Type: 'PlayAgain',
        Message: "Play" // Empty array to start a new game
    };

    ws.send(JSON.stringify(data));
    console.log('Sent Play Again message:', JSON.stringify(data));

    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
}
