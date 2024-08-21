package game

import (
	"math/rand"
	"sync"
)

const (
	Rock = iota + 1
	Paper
	Scissors
)

type Board struct {
	Seat1 *Seat
	Seat2 *Seat
}

type Seat struct {
	Player      *Player
	CardsMutex  sync.Mutex
	CardSlots   []int
	Points      int
	CardUsed    int
	IsConnected bool
}

func NewSeat(player *Player) *Seat {
	return &Seat{
		Player:      player,
		CardSlots:   make([]int, 3),
		CardUsed:    0,
		IsConnected: true,
	}
}

func (seat *Seat) GetNewHand() []int {
	deckSize := len(seat.Player.Deck)
	hand := make([]int, 3)
	for i := 0; i < 3; i++ {
		deckIndex := getRandomIndex(deckSize - i - 1 - seat.CardUsed)

		hand[i] = seat.Player.Deck[deckIndex]
		seat.Player.Deck[deckIndex] = seat.Player.Deck[deckSize-i-1-seat.CardUsed]
		seat.Player.Deck[deckSize-i-1-seat.CardUsed] = -1

	}
	seat.CardUsed += 3

	return hand
}

func getRandomIndex(maxIn int) int {
	if maxIn == 0 {
		return 0
	}
	return rand.Int() % maxIn
}
