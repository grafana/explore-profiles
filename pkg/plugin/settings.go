package plugin

type Settings struct {
	BackendURL                   string `json:"backendUrl"`
	BasicAuthUser                string `json:"basicAuthUser"`
	BasicAuthPassword            string `json:"basicAuthPassword"`
	EnableFlameGraphDotComExport string `json:"enableFlameGraphDotComExport"`
}
