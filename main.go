package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

type SearchRequest struct {
	Query                    string   `json:"query"`
	AutoParameters           bool     `json:"auto_parameters"`
	Topic                    string   `json:"topic"`
	SearchDepth              string   `json:"search_depth"`
	ChunksPerSource          int      `json:"chunks_per_source"`
	MaxResults               int      `json:"max_results"`
	TimeRange                *string  `json:"time_range"`
	Days                     int      `json:"days"`
	IncludeAnswer            bool     `json:"include_answer"`
	IncludeRawContent        bool     `json:"include_raw_content"`
	IncludeImages            bool     `json:"include_images"`
	IncludeImageDescriptions bool     `json:"include_image_descriptions"`
	IncludeDomains           []string `json:"include_domains"`
	ExcludeDomains           []string `json:"exclude_domains"`
	Country                  *string  `json:"country"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Serve static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Serve the main page
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "templates/index.html")
	})

	// Handle search API requests
	http.HandleFunc("/search", handleSearch)

	port := ":8080"
	fmt.Printf("Server is running on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var searchReq SearchRequest
	if err := json.NewDecoder(r.Body).Decode(&searchReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Prepare request to Tavily API
	tavilyURL := "https://api.tavily.com/search"
	jsonData, err := json.Marshal(searchReq)
	if err != nil {
		http.Error(w, "Error preparing request", http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequest("POST", tavilyURL, bytes.NewBuffer(jsonData))
	if err != nil {
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	req.Header.Set("Authorization", "Bearer "+os.Getenv("TAVILY_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	// Make request to Tavily API
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Error making request to Tavily API", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error reading response", http.StatusInternalServerError)
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}
