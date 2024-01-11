package plugin

type Settings struct {
	BackendURL        string `json:"backendUrl"`
	BasicAuthUser     string `json:"basicAuthUser"` // must be treated as a string
	BasicAuthPassword string `json:"basicAuthPassword"`
}
