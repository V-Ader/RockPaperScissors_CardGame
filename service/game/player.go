package game

import (
	"github.com/V-Ader/RockPaperScissors_CardGame/common/utils"
	"github.com/gorilla/websocket"
)

type Player struct {
	Id   string
	Ws   *websocket.Conn
	Name string
	Deck []int
}

func NewPlayer(conn *websocket.Conn, name string) *Player {

	return &Player{
		Id:   utils.GenerateId(),
		Ws:   conn,
		Name: name,
		Deck: newDeck(),
	}
}

func (p *Player) Restarted() *Player {
	p.Deck = newDeck()
	return p
}

func newDeck() []int {
	deck := make([]int, 9)

	for i := 0; i < 3; i++ {
		deck[i] = Rock
		deck[i+3] = Paper
		deck[i+6] = Scissors
	}

	return deck
}
