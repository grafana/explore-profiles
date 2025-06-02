// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1

import (
	json "encoding/json"
	errors "errors"
	fmt "fmt"
)

// +k8s:openapi-gen=true
type Spec struct {
	Name  string                `json:"name"`
	Value BoolOrFloat64OrString `json:"value"`
}

// NewSpec creates a new Spec object.
func NewSpec() *Spec {
	return &Spec{
		Value: *NewBoolOrFloat64OrString(),
	}
}

// +k8s:openapi-gen=true
type BoolOrFloat64OrString struct {
	Bool    *bool    `json:"Bool,omitempty"`
	Float64 *float64 `json:"Float64,omitempty"`
	String  *string  `json:"String,omitempty"`
}

// NewBoolOrFloat64OrString creates a new BoolOrFloat64OrString object.
func NewBoolOrFloat64OrString() *BoolOrFloat64OrString {
	return &BoolOrFloat64OrString{}
}

// MarshalJSON implements a custom JSON marshalling logic to encode `BoolOrFloat64OrString` as JSON.
func (resource BoolOrFloat64OrString) MarshalJSON() ([]byte, error) {
	if resource.Bool != nil {
		return json.Marshal(resource.Bool)
	}

	if resource.Float64 != nil {
		return json.Marshal(resource.Float64)
	}

	if resource.String != nil {
		return json.Marshal(resource.String)
	}

	return []byte("null"), nil
}

// UnmarshalJSON implements a custom JSON unmarshalling logic to decode `BoolOrFloat64OrString` from JSON.
func (resource *BoolOrFloat64OrString) UnmarshalJSON(raw []byte) error {
	if raw == nil {
		return nil
	}

	var errList []error

	// Bool
	var Bool bool
	if err := json.Unmarshal(raw, &Bool); err != nil {
		errList = append(errList, err)
		resource.Bool = nil
	} else {
		resource.Bool = &Bool
		return nil
	}

	// Float64
	var Float64 float64
	if err := json.Unmarshal(raw, &Float64); err != nil {
		errList = append(errList, err)
		resource.Float64 = nil
	} else {
		resource.Float64 = &Float64
		return nil
	}

	// String
	var String string
	if err := json.Unmarshal(raw, &String); err != nil {
		errList = append(errList, err)
		resource.String = nil
	} else {
		resource.String = &String
		return nil
	}

	return errors.Join(errList...)
}
