let ws;
let playerId;
let gameId;

function generateId() {
    return (
        Math.floor(Math.random() * 10000).toString().padStart(4, '0') + '-' +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0') + '-' +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0') + '-' +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    );
}

function reconnect() {
}

function connect() {
    const playerName = document.getElementById('playerName').value;

    if (!playerName) {
        alert('Please enter a player name');
        return;
    }

    const connection = {
        ConnectionType: "Join",
        PlayerId: generateId(),
        PlayerName: playerName,
        GameId: "game_1234"
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

        if (message.Type === "GameInfo") {
            console.log(message)
            playerId = message.PlayerId;
            gameId = message.GameId;
            document.getElementById('playerId').textContent = playerId;
            document.getElementById('gameId').textContent = gameId;
            document.getElementById('infoContainer').style.display = 'block';
        } else if (message.Type === "Cards") {
            console.log(message)
            document.getElementById('loginContainer').style.display = 'none';

            document.getElementById('gameContainer').style.display = 'block';
            document.getElementById('hand-card1').textContent = message.Cards[0];
            document.getElementById('hand-card2').textContent = message.Cards[1];
            document.getElementById('hand-card3').textContent = message.Cards[2];

            document.getElementById('digit1').value = null;
            document.getElementById('digit2').value = null;
            document.getElementById('digit3').value = null;
        }
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        alert('WebSocket error');
    };
}

function sendDigits() {
    if (!ws) {
        alert('WebSocket connection is not open');
        return;
    }

    const digit1 = document.getElementById('digit1').value;
    const digit2 = document.getElementById('digit2').value;
    const digit3 = document.getElementById('digit3').value;

    const digits = [parseInt(digit1, 10), parseInt(digit2, 10), parseInt(digit3, 10)];
    const data = {
        Cards: digits
    };
    
    ws.send(JSON.stringify(data));
    console.log('Sent digits:', JSON.stringify(data));
}
