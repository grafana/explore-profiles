package plugin

import (
	"net/http"
)

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(proxy *Proxy, mux *http.ServeMux) {
	mux.HandleFunc("/", proxy.HandleHTTP)
}
