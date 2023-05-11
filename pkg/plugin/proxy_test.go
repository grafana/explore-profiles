package plugin_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/pyroscope-io/grafana-pyroscope-app/pkg/plugin"
)

func TestProxy(t *testing.T) {
	type proxyParams struct {
		Path         string `json:"host"`
		AuthUser     string `json:"authUser"`
		AuthPassword string `json:"authPassword"`
	}

	want := proxyParams{
		Path:         "/mypath?myquery=param",
		AuthUser:     "myuser",
		AuthPassword: "myauth",
	}

	targetSvr := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, password, ok := r.BasicAuth()
		if !ok {
			t.Fatalf("expected ok when getting basic auth")
		}

		err := json.NewEncoder(w).Encode(proxyParams{
			Path:         r.URL.RequestURI(),
			AuthUser:     user,
			AuthPassword: password,
		})

		if err != nil {
			t.Fatal(err)
		}
	}))

	logger := log.NewWithLevel(log.NoLevel)

	rp, err := plugin.NewProxy(logger, plugin.Settings{
		BackendURL:        targetSvr.URL,
		BasicAuthUser:     want.AuthUser,
		BasicAuthPassword: want.AuthPassword,
	})
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, want.Path, nil)
	w := httptest.NewRecorder()
	rp.HandleHTTP(w, req)

	var got proxyParams
	err = json.NewDecoder(w.Result().Body).Decode(&got)
	if err != nil {
		t.Fatal(err)
	}
	if want.AuthPassword != got.AuthPassword {
		t.Fatalf("expected '%s' but got '%s'", want.AuthPassword, got.AuthPassword)
	}
	if want.AuthUser != got.AuthUser {
		t.Fatalf("expected '%s' but got '%s'", want.AuthUser, got.AuthUser)
	}
	if want.Path != got.Path {
		t.Fatalf("expected '%s' but got '%s'", want.Path, got.Path)
	}
}
