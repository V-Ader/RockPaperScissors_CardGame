package game

import (
	"log"
	"sync"
)

type Lobby struct {
	WaitingPlayer    *Player
	HasWaitingPlayer bool

	games      []*Game
	gamesMutex sync.Mutex
}

func NewLobby() *Lobby {
	return &Lobby{
		games:            []*Game{},
		HasWaitingPlayer: false,
	}
}

func (lobby *Lobby) HasPlayerWaiting() bool {
	return lobby.HasWaitingPlayer
}

func (lobby *Lobby) FreePlayer() *Player {
	lobby.HasWaitingPlayer = false
	return lobby.WaitingPlayer
}

func (lobby *Lobby) AddPlayer(player *Player) {
	lobby.gamesMutex.Lock()
	lobby.WaitingPlayer = player
	lobby.HasWaitingPlayer = true
	lobby.gamesMutex.Unlock()

	SendMessage(lobby.WaitingPlayer.Ws, "Waiting for 2nd player")
}

func (lobby *Lobby) StartNewGame(player *Player) {
	lobby.gamesMutex.Lock()
	newGame := NewGame(lobby.FreePlayer(), player)
	lobby.games = append(lobby.games, newGame)
	lobby.gamesMutex.Unlock()

	newGame.StartGame()
	log.Println("new Game created")
}
