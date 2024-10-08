package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/V-Ader/RockPaperScissors_CardGame/service/game"
	"github.com/gorilla/websocket"
)

var (
	lobby game.Lobby = *game.NewLobby()

	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

func WsHandler(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	handleConnection(ws)
}

func handleConnection(conn *websocket.Conn) {
	// join game
	var newConnectionMessage NewConnection
	err := conn.ReadJSON(&newConnectionMessage)
	if err != nil {
		log.Println(err)
		return
	}

	// handle game connection
	newPlayer := game.NewPlayer(conn, newConnectionMessage.PlayerName)

	if newConnectionMessage.ConnectionType == "reconnect" {
		fmt.Println("reconnect")
		newPlayer.Id = newConnectionMessage.PlayerId
		go lobby.Reconnect(newPlayer, newConnectionMessage.GameId)
	} else {
		if lobby.HasPlayerWaiting() {
			go lobby.StartNewGame(newPlayer)
		} else {
			go lobby.AddPlayer(newPlayer)
		}
	}
}
