package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/V-Ader/RockPaperScissors_CardGame/service/server"
)

func setupRoutes() {
	http.HandleFunc("/ws", server.WsHandler)
}

func main() {
	fmt.Println("Starting the server")
	setupRoutes()
	log.Fatal(http.ListenAndServe(":8080", nil))
}
