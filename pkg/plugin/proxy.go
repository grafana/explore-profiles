package plugin

import (
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type Proxy struct {
	logger       log.Logger
	reverseProxy *httputil.ReverseProxy
}

// NewProxy contructs a proxy that handles ServeHTTP
// To a server set in settings
// Passing any auth as required
func NewProxy(logger log.Logger, settings Settings) (*Proxy, error) {
	baseURL, err := url.Parse(settings.BackendURL)
	if err != nil {
		return nil, err
	}

	director := func(req *http.Request) {
		req.URL.Host = baseURL.Host
		req.URL.Scheme = baseURL.Scheme

		// Let's log before setting up basic auth
		logger.Debug("setting up URL as target", req.URL)
		req.SetBasicAuth(string(settings.BasicAuthUser), settings.BasicAuthPassword)
	}

	rp := &httputil.ReverseProxy{
		Director: director,
		ErrorHandler: func(rw http.ResponseWriter, r *http.Request, err error) {
			logger.Error("error proxying to target:", err)
			// TODO: capture the status code and forward it back
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(err.Error()))
		},
	}

	return &Proxy{
		logger:       logger,
		reverseProxy: rp,
	}, nil
}

func (p *Proxy) HandleHTTP(w http.ResponseWriter, req *http.Request) {
	p.reverseProxy.ServeHTTP(w, req)
}
