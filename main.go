package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// Message represents our API response
type Message struct {
	Text string `json:"text"`
}

func main() {
	// Load .env file if it exists
	godotenv.Load()

	// Initialize Gin router
	router := gin.Default()

	// Serve static files
	router.Static("/static", "./static")

	// Serve the HTML template
	router.LoadHTMLGlob("templates/*")
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	// API endpoints
	api := router.Group("/api")
	{
		api.GET("/message", func(c *gin.Context) {
			message := Message{Text: "Hello from Go API!"}
			c.JSON(http.StatusOK, message)
		})
	}

	// Run the server
	log.Println("Server starting on http://localhost:8081")
	router.Run(":8081")
}
