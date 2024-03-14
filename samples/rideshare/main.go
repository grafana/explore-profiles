package main

import (
	"context"
	"log"
	"math/rand"
	"net/http"
	"os"
	"rideshare/bike"
	"rideshare/car"
	"rideshare/scooter"

	"github.com/grafana/pyroscope-go"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	otelpyroscope "github.com/pyroscope-io/otel-profiling-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func bikeRoute(w http.ResponseWriter, r *http.Request) {
	bike.OrderBike(r.Context(), 1)
	w.Write([]byte("<h1>Bike ordered</h1>"))
}

func scooterRoute(w http.ResponseWriter, r *http.Request) {
	scooter.OrderScooter(r.Context(), 2)
	w.Write([]byte("<h1>Scooter ordered</h1>"))
}

func carRoute(w http.ResponseWriter, r *http.Request) {
	car.OrderCar(r.Context(), 3)
	w.Write([]byte("<h1>Car ordered</h1>"))
}

func index(w http.ResponseWriter, r *http.Request) {
	result := "<h1>environment vars:</h1>"
	for _, env := range os.Environ() {
		result += env + "<br>"
	}
	w.Write([]byte(result))
}

func main() {
	serverAddress := os.Getenv("PYROSCOPE_SERVER_ADDRESS")
	if serverAddress == "" {
		serverAddress = "http://localhost:4040"
	}
	appName := os.Getenv("PYROSCOPE_APPLICATION_NAME")
	if appName == "" {
		appName = "ride-sharing-app"
	}

	containerID := os.Getenv("HOSTNAME")
	if containerID == "" {
		containerID = "unknown"
	}

	tp, err := setupTracing(appName, containerID, serverAddress)
	if err != nil {
		log.Fatalf("failed to set up tracing integration: %v", err)
	}
	defer func() {
		_ = tp.Shutdown(context.Background())
	}()

	_, err = pyroscope.Start(pyroscope.Config{
		ApplicationName: appName,
		ServerAddress:   serverAddress,
		AuthToken:       os.Getenv("PYROSCOPE_AUTH_TOKEN"),
		Logger:          pyroscope.StandardLogger,
		Tags: map[string]string{
			"container_id":       containerID,
			"service_git_ref":    randomSha(),
			"service_repository": "https://github.com/grafana/pyroscope",
		},
	})
	if err != nil {
		log.Fatalf("error starting pyroscope profiler: %v", err)
	}

	http.Handle("/", otelhttp.NewHandler(http.HandlerFunc(index), "IndexHandler"))
	http.Handle("/bike", otelhttp.NewHandler(http.HandlerFunc(bikeRoute), "BikeHandler"))
	http.Handle("/scooter", otelhttp.NewHandler(http.HandlerFunc(scooterRoute), "ScooterHandler"))
	http.Handle("/car", otelhttp.NewHandler(http.HandlerFunc(carRoute), "CarHandler"))

	log.Fatal(http.ListenAndServe(":5000", nil))
}

func randomSha() string {
	shas := []string{
		"a05c3f3158cc9a996d7f0811f5b3f1d00da9b20f",
		"f3e93f846e57b7f2dcae57b9f11a407873a8fc88",
		"14f90bfbb96647db7a8e323c3dd0f8b7c8cf9e84",
		"9c795e4366a173f09cd0ea189cd80d2b8258697e",
		"90b411f5190f28078e928a1b7d5ea4d25818d5ab",
		"25c4dc3a7ae63f98421980cdcb30fcf9bf29ced1",
	}
	// return a random sha from the list
	return shas[rand.Intn(len(shas))]
}

func setupTracing(appName string, containerID string, pyroscopeURL string) (tp *sdktrace.TracerProvider, err error) {
	tp, err = tracerProviderDebug()
	if err != nil {
		return nil, err
	}

	// Set the Tracer Provider and the W3C Trace Context propagator as globals.
	// We wrap the tracer provider to also annotate goroutines with Span ID so
	// that pprof would add corresponding labels to profiling samples.
	otel.SetTracerProvider(otelpyroscope.NewTracerProvider(tp,
		otelpyroscope.WithAppName(appName),
		otelpyroscope.WithRootSpanOnly(true),
		otelpyroscope.WithAddSpanName(true),
		otelpyroscope.WithPyroscopeURL(pyroscopeURL),
		otelpyroscope.WithProfileBaselineLabels(map[string]string{"container_id": containerID}),
		otelpyroscope.WithProfileBaselineURL(true),
		otelpyroscope.WithProfileURL(true),
	))

	// Register the trace context and baggage propagators so data is propagated across services/processes.
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp, err
}

func tracerProviderDebug() (*sdktrace.TracerProvider, error) {
	var exporter sdktrace.SpanExporter
	if os.Getenv("DEBUG") == "1" {
		var err error
		exporter, err = stdouttrace.New(stdouttrace.WithPrettyPrint())
		if err != nil {
			return nil, err
		}
	}

	return sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(sdktrace.NewSimpleSpanProcessor(exporter))), nil
}
