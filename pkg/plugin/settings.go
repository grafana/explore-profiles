package plugin

import "encoding/json"

type Settings struct {
	BackendURL                   string          `json:"backendUrl"`
	BasicAuthUser                json.RawMessage `json:"basicAuthUser"` // support string or integer
	BasicAuthPassword            string          `json:"basicAuthPassword"`
	EnableFlameGraphDotComExport bool            `json:"enableFlameGraphDotComExport"`
}
