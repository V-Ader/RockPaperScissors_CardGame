package game

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/V-Ader/RockPaperScissors_CardGame/common/utils"
	"github.com/gorilla/websocket"
)

type Game struct {
	Name    string
	Player1 *Player
	Player2 *Player

	Board Board
}

func NewGame(player1 *Player, player2 *Player) *Game {
	fmt.Println("new Game created")
	return &Game{
		Name:    utils.GenerateSizedId(2),
		Player1: player1,
		Player2: player2,
	}
}

func (game *Game) StartGame() {
	game.Board = Board{
		Seat1: NewSeat(game.Player1.Restarted()),
		Seat2: NewSeat(game.Player2.Restarted()),
	}

	game.sendPlayerDetailes()
	game.NewTurn()
}

func (game *Game) sendPlayerDetailes() {
	game.sendPlayer1Detailes()
	game.sendPlayer2Detailes()
}

func (game *Game) sendPlayer1Detailes() {
	message, _ := json.Marshal(&GameInfo{
		Type: "GameInfo",

		PlayerId:   game.Player1.Id,
		PlayerName: game.Player1.Name,
		EnemyName:  game.Player2.Name,
		GameId:     game.Name,
	})
	SendJson(game.Player1.Ws, string(message))
}

func (game *Game) sendPlayer2Detailes() {
	message, _ := json.Marshal(&GameInfo{
		Type: "GameInfo",

		PlayerId:   game.Player2.Id,
		PlayerName: game.Player2.Name,
		EnemyName:  game.Player1.Name,
		GameId:     game.Name,
	})
	SendJson(game.Player2.Ws, string(message))
}

func (game *Game) NewTurn() {
	for !game.isEnd() {
		game.setPlayersHands()

		game.sendPlayersHands()

		wg := new(sync.WaitGroup)
		wg.Add(2)

		go game.handleSeatMoves(wg, game.Board.Seat1)
		go game.handleSeatMoves(wg, game.Board.Seat2)

		wg.Wait()

		game.sendEnemysMove()

		game.calculateResult()

		game.sendResults()
	}

	game.GameOver()
}

func (game *Game) setPlayersHands() {
	game.Board.Seat1.CardSlots = game.Board.Seat1.GetNewHand()
	game.Board.Seat2.CardSlots = game.Board.Seat2.GetNewHand()
}

func (game *Game) sendPlayersHands() {
	game.sendPlayer1Hands()
	game.sendPlayer2Hands()
}

func (game *Game) sendPlayer1Hands() {
	message, _ := json.Marshal(&Cards{
		Type:  "Cards",
		Cards: game.Board.Seat1.CardSlots,
	})
	SendJson(game.Player1.Ws, string(message))
}

func (game *Game) sendPlayer2Hands() {
	message, _ := json.Marshal(&Cards{
		Type:  "Cards",
		Cards: game.Board.Seat2.CardSlots,
	})
	SendJson(game.Player2.Ws, string(message))
}

func (game *Game) handleSeatMoves(wg *sync.WaitGroup, seat *Seat) {
	var move Results
	defer wg.Done()

	for {
		if !seat.IsConnected {
			log.Println("Player disconnected. Waiting for reconnection...")
			time.Sleep(1 * time.Second)
			continue
		}

		// waiting for the move message
		err := seat.Player.Ws.ReadJSON(&move)
		if err != nil {
			log.Println("Error reading move:", err)

			if websocket.IsUnexpectedCloseError(err) {
				seat.IsConnected = false
			}
			continue
		}

		if isValid(move) {
			seat.CardSlots = move.Cards
			break
		} else {
			game.sendInvalidInfo(seat.Player.Ws)
		}

	}
}

func isValid(move Results) bool {
	return len(move.Cards) == 3
}

func (game *Game) sendInvalidInfo(ws *websocket.Conn) {
	message, _ := json.Marshal(&Info{
		Type:    "Error",
		Message: "Invalid move",
	})
	SendJson(ws, string(message))
}

func (game *Game) sendEnemysMove() {
	message, _ := json.Marshal(&Cards{
		Type:  "Cards",
		Cards: game.Board.Seat2.CardSlots,
	})
	SendJson(game.Player1.Ws, string(message))
	message, _ = json.Marshal(&Cards{
		Type:  "Cards",
		Cards: game.Board.Seat1.CardSlots,
	})
	SendJson(game.Player2.Ws, string(message))
}

func (game *Game) calculateResult() {
	for i := 0; i < 3; i++ {
		result1, result2 := gradeCards(game.Board.Seat1.CardSlots[i], game.Board.Seat2.CardSlots[i])
		game.Board.Seat1.Points += result1
		game.Board.Seat2.Points += result2
	}
}

func gradeCards(c1 int, c2 int) (int, int) {
	outcomes := [3][3]int{
		{0, -1, 1},
		{1, 0, -1},
		{-1, 1, 0},
	}

	result := outcomes[c1-1][c2-1]

	switch result {
	case 1:
		return 1, 0
	case -1:
		return 0, 1
	default:
		return 0, 0
	}
}

func (game *Game) sendResults() {
	game.sendPlayer1Results()
	game.sendPlayer2Results()
}

func (game *Game) sendPlayer1Results() {
	message, _ := json.Marshal(&GameStatus{
		Type:         "GameStatus",
		PlayerPoints: game.Board.Seat1.Points,
		EnemyPoints:  game.Board.Seat2.Points,
	})
	SendJson(game.Player1.Ws, string(message))
}

func (game *Game) sendPlayer2Results() {
	message, _ := json.Marshal(&GameStatus{
		Type:         "GameStatus",
		PlayerPoints: game.Board.Seat2.Points,
		EnemyPoints:  game.Board.Seat1.Points,
	})
	SendJson(game.Player2.Ws, string(message))
}

func (game *Game) isEnd() bool {
	return (len(game.Player1.Deck) - game.Board.Seat1.CardUsed) < 3
}

func (game *Game) GameOver() {
	game.sendGameOverResults()

	wg := new(sync.WaitGroup)
	wg.Add(2)

	go game.handleSeatNewGameResponse(wg, game.Board.Seat1)
	go game.handleSeatNewGameResponse(wg, game.Board.Seat2)

	wg.Wait()

	if game.Board.Seat1.IsConnected && game.Board.Seat2.IsConnected {
		game.StartGame()
	}
}

func (game *Game) handleSeatNewGameResponse(wg *sync.WaitGroup, seat *Seat) {
	var message Info
	defer wg.Done()

	err := seat.Player.Ws.ReadJSON(&message)
	if err != nil {
		log.Println("Error reading message:", err)
		seat.IsConnected = false
	}
}

func (game *Game) getWinner() string {
	if game.Board.Seat1.Points == game.Board.Seat2.Points {
		return "Draw"
	}
	if game.Board.Seat1.Points > game.Board.Seat2.Points {
		return game.Player1.Id
	}
	return game.Player2.Id
}

func (game *Game) sendGameOverResults() {
	message, _ := json.Marshal(&GameOverStatus{
		Type:         "GameOverStatus",
		Winner:       game.getWinner(),
		PlayerPoints: game.Board.Seat1.Points,
		EnemyPoints:  game.Board.Seat2.Points,
	})
	SendJson(game.Player1.Ws, string(message))
	message, _ = json.Marshal(&GameOverStatus{
		Type:         "GameOverStatus",
		Winner:       game.getWinner(),
		PlayerPoints: game.Board.Seat2.Points,
		EnemyPoints:  game.Board.Seat1.Points,
	})
	SendJson(game.Player2.Ws, string(message))
}

func (game *Game) ReconnectPlayer(player *Player) error {
	if game.Board.Seat1.Player.Id == player.Id {
		player.Name = game.Board.Seat1.Player.Name
		game.Board.Seat1.Player = player
		game.Player1 = player
		game.Board.Seat1.IsConnected = true

		game.SendReconnectPackageP1()
		return nil
	} else if game.Board.Seat2.Player.Id == player.Id {
		player.Name = game.Board.Seat2.Player.Name
		game.Board.Seat2.Player = player
		game.Player2 = player
		game.Board.Seat2.IsConnected = true

		game.SendReconnectPackageP2()
		return nil
	}
	return fmt.Errorf("seat not found")
}

func (game *Game) SendReconnectPackageP1() {
	SendMessage(game.Board.Seat1.Player.Ws, "OK")
	game.sendPlayer1Detailes()
	game.sendPlayer1Results()
	game.sendPlayer1Hands()

}

func (game *Game) SendReconnectPackageP2() {
	SendMessage(game.Board.Seat2.Player.Ws, "OK")

	game.sendPlayer2Detailes()
	game.sendPlayer2Results()
	game.sendPlayer2Hands()
}
