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
            playerId = message.PlayerId;
            gameId = message.GameId;
            document.getElementById('playerId').textContent = playerId;
            document.getElementById('gameId').textContent = gameId;
            document.getElementById('infoContainer').style.display = 'block';
        } else if (message.Type === "Cards") {
            document.getElementById('inputsContainer').style.display = 'block';
            document.getElementById('digit1').value = message.Cards[0];
            document.getElementById('digit2').value = message.Cards[1];
            document.getElementById('digit3').value = message.Cards[2];
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

    const digits = [digit1, digit2, digit3];

    ws.send(JSON.stringify(digits));
    console.log('Sent digits:', digits);
}
