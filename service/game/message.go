package game

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

type GameInfo struct {
	Type     string
	PlayerId string
	GameId   string
}

// contains user-sorted cards from his hand
type Cards struct {
	Type  string
	Cards []int
}

// contains user-sorted cards from enemys hand
type Results struct {
	Type  string
	Cards []int
}

type GameStatus struct {
	Type         string
	PlayerPoints int
	EnemyPoints  int
}

type GameOverStatus struct {
	Type         string
	Winner       string
	PlayerPoints int
	EnemyPoints  int
}

func SendJson(conn *websocket.Conn, json string) {
	if err := conn.WriteJSON(json); err != nil {
		log.Println(err)
		return
	}
}

func SendMessage(conn *websocket.Conn, message string) {
	jsonMessage, _ := json.Marshal(message)
	SendJson(conn, string(jsonMessage))
}
