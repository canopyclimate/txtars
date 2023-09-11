package main

import (
	"io"
	"log"
	"net/http"

	"golang.org/x/tools/txtar"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("reading went wrong: %v", err)
			return
		}

		ar := txtar.Parse(body)
		out := txtar.Format(ar)
		// log.Printf("GOT: %q", body)
		// log.Printf("WRITING: %q", out)
		_, err = w.Write(out)
		if err != nil {
			log.Printf("writing went wrong: %v", err)
		}
	})

	log.Println("Running on 52514")

	log.Fatal(http.ListenAndServe(":52514", nil))
}
