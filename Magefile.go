//go:build mage
// +build mage

package main

import (
	"fmt"
	"os"

	//mage:import
	build "github.com/grafana/grafana-plugin-sdk-go/build"
)

// Default configures the default target.
var Default = build.BuildAll

func init() {
	err := build.SetBeforeBuildCallback(func(cfg build.Config) (build.Config, error) {
		outputPath := os.Getenv("MAGE_OUTPUT_FOLDER")
		if outputPath != "" {
			cfg.OutputBinaryPath = outputPath
		}

		return cfg, nil
	})
	if err != nil {
		panic(fmt.Sprintf("failed to set BeforeBuildCallback: %v", err))
	}
}
