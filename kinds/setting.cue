package kinds

setting: {
	kind: "Setting"
	scope: "Namespaced"
	codegen: {
		ts: enabled: true
		go: enabled: true
	}
	current: "v1"
	versions: {
		"v1": {
			schema: {
				spec: {
					name: string
					value: bool | number | string
				}
			}
		}
	}
}
