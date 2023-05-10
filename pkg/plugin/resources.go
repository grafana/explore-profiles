package plugin

import (
	"encoding/json"
	"net/http"
	"net/http/httputil"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// handlePing is an example HTTP GET resource that returns a {"message": "ok"} JSON response.
func (a *App) handlePing(w http.ResponseWriter, req *http.Request) {
	log.DefaultLogger.Info("host %s", req.Host)
	log.DefaultLogger.Info(req.Host)
	log.DefaultLogger.Info("remoteAddr %s", req.RemoteAddr)
	log.DefaultLogger.Info(req.RemoteAddr)

	w.Header().Add("Content-Type", "application/json")
	if _, err := w.Write([]byte(`{"message": "ok????!!!!!"}`)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// handleEcho is an example HTTP POST resource that accepts a JSON with a "message" key and
// returns to the client whatever it is sent.
func (a *App) handleEcho(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) proxyToPhlare(w http.ResponseWriter, req *http.Request) {
	director := func(req *http.Request) {
		// TODO: parse from a string?
		req.URL.Scheme = "http"
		req.URL.Host = "phlare:4100"
	}

	proxy := &httputil.ReverseProxy{Director: director,
		ErrorHandler: func(rw http.ResponseWriter, r *http.Request, err error) {
			log.DefaultLogger.Error("error proxying to phlare: '%+v'", err)
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(err.Error()))
		},
	}
	proxy.ServeHTTP(w, req)
}

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {

	mux.HandleFunc("/ping", a.handlePing)
	mux.HandleFunc("/echo", a.handleEcho)
	mux.HandleFunc("/", a.proxyToPhlare)
}
