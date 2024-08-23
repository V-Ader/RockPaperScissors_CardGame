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

const cardWidth = 100;
const cardHeight = 150;


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
        ConnectionType: "Join",
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

    gameInfo.playerName = message.PlayerName;
    gameInfo.enemyName = message.EnemyName;

    // document.getElementById('playerId').textContent = playerId;
    // document.getElementById('gameId').textContent = gameId;
    // document.getElementById('infoContainer').style.display = 'block';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
}

function handleGameStatus(message) {
    gameInfo.playerPoints = message.PlayerPoints;
    gameInfo.enemyPoints = message.EnemyPoints;
}

function handleCards(cards) {
    console.log("handleCards");
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

    drawPlayButton()

}

function drawScores() {
    ctx.fillStyle = 'black'; 
    ctx.font = '20px Arial';

    const score = gameInfo.playerPoints + " : " + gameInfo.enemyPoints;
    const centerX = canvas.width / 2;
    const positionY = 50; 
    
    ctx.fillText(score, centerX, positionY);
}


function drawPlayButton() {
    const button = {
        width: 150,
        height: 40,
        x: canvas.width / 2 - 150 / 2,
        y: canvas.height - 40 * 1.5,
    };
    
    ctx.fillStyle = 'white'; // Button background color
    ctx.strokeStyle = 'black';  // Set the card border color
    ctx.fillRect(button.x, button.y, button.width, button.height);
    ctx.stroke();

    ctx.fillStyle = 'black'; // Text color
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Send!', button.x + button.width / 2, button.y + button.height / 2);

    canvas.dataset.sendCardsButton = JSON.stringify({ x: button.x, y: button.y, width: button.width, height: button.height });
}

function getCardX(index) {
    const totalCardsWidth = 3 * cardWidth;
    const totalMargin = canvas.width - totalCardsWidth;

    const margin = totalMargin / 4;

    return margin + index * (cardWidth + margin);
}


function getCardY() {
    return (canvas.height * 0.5) - (cardHeight / 2); }

function drawCard(card, index) {
    const cardX = getCardX(index);
    const cardY = getCardY();
    const cornerRadius = 10;

    // Draw the card (rounded rectangle)
    ctx.fillStyle = 'white';  // Set the card background color
    ctx.strokeStyle = 'black';  // Set the card border color
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cornerRadius);

    // Set the text style and color before drawing the icon
    ctx.fillStyle = 'black';  // Set the text color
    ctx.font = '50px Arial';  // Increase font size for emoji
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Determine the icon to display based on the card value
    let icon;
    switch(card) {
        case 1:
            icon = '✊';  // Rock
            break;
        case 2:
            icon = '✋';  // Paper
            break;
        case 3:
            icon = '✌';  // Scissors
            break;
        default:
            icon = '';  // Default if card is not 1, 2, or 3
    }

    // Draw the icon in the center of the card
    ctx.fillText(icon, cardX + cardWidth / 2, cardY + cardHeight / 2);

    // If the card is selected, draw the selection order below the card
    const selectedIndex = selectedCards.indexOf(index);
    if (selectedIndex !== -1) {
        ctx.fillStyle = 'black'; // Set color for the selection number
        ctx.font = '20px Arial';  // Smaller font for the selection number
        ctx.fillText(selectedIndex + 1, cardX + cardWidth / 2, cardY + cardHeight + 20);
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
    const frameHeight = 130; // Increased height for the button
    const frameX = 20;
    const frameY = canvas.height - frameHeight - 20;
    const buttonWidth = 150;
    const buttonHeight = 40;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = frameY + frameHeight - buttonHeight - 10;

    // Clear the area where the frame will be drawn
    ctx.clearRect(frameX, frameY, frameWidth, frameHeight);

    // Draw the frame background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';  // Semi-transparent black
    ctx.fillRect(frameX, frameY, frameWidth, frameHeight);

    // Set the text style
    ctx.fillStyle = 'white';  // Text color
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Display the message in the center of the frame
    ctx.fillText(message, canvas.width / 2, frameY + frameHeight / 2 - 20);

    // Draw the "Play Again" button
    ctx.fillStyle = 'green';  // Button background color
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = 'white';  // Button text color
    ctx.font = '18px Arial';
    ctx.fillText('Play Again', canvas.width / 2, buttonY + buttonHeight / 2);

    // Save button position for click detection
    canvas.dataset.playAgainButton = JSON.stringify({ x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight });
}


canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if the click is within the "Play Again" button
    const sendCardsButton = canvas.dataset.sendCardsButton ? JSON.parse(canvas.dataset.sendCardsButton) : null;
    const playAgainButton = canvas.dataset.playAgainButton ? JSON.parse(canvas.dataset.playAgainButton) : null;
    if (playAgainButton && x >= playAgainButton.x && x <= playAgainButton.x + playAgainButton.width && y >= playAgainButton.y && y <= playAgainButton.y + playAgainButton.height) {
        playAgain();
    } else if (sendCardsButton && x >= sendCardsButton.x && x <= sendCardsButton.x + sendCardsButton.width && y >= sendCardsButton.y && y <= sendCardsButton.y + sendCardsButton.height) {
        sendDigits();
    } else {
        // Check if any card was clicked
        displayedCards.forEach((card, index) => {
            const cardX = getCardX(index);
            const cardY = getCardY();

            if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                selectCard(index);
            }
        });
    }
});

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
        Cards: [] // Empty array to start a new game
    };

    ws.send(JSON.stringify(data));
    console.log('Sent Play Again message:', JSON.stringify(data));

    // Optionally, you can clear the canvas or reset the game state here
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
}
