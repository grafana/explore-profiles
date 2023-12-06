export default `
"To interpret the provided flamegraph in DOT format, please visualize the DOT content using a Graphviz tool or online service. Here's a general analysis based on the DOT format:

1. Performance Bottleneck:
The performance bottleneck is best identified by the code paths that take the highest cumulative time in execution. 

In the given data, \`N1 http.HandlerFunc.ServeHTTP\` appears near the top, with a cumulative time of 7108.10s (67.89%) and is connected to many other nodes. The large cumulative percentage indicates that within this function or through its call chain, a significant amount of time is spent.

2. Root Cause:
To find the root causes, we need to look at what consumes the most time under \`ServeHTTP\`. 

- \`N30 runtime.scanobject\` with 150.74s (1.44%) could indicate costly garbage collection.
- \`N29 flate.(*decompressor).huffmanBytesReader\` with 300.65s (2.87%) could imply heavy decompression work.
- \`N23 v1.(*Location).Reset\` with 199.80s (1.91%) suggests potential inefficiencies in object resets.
- \`N17 flate.(*compressor).reset\` with 561.54s (5.36%) and \`N16 syscall.Syscall6\` with 502.84s (4.80%) point to significant syscalls and compression work.

3. Recommended Fix:
Based on the above bottlenecks, the following actions could be considered:

- Investigate garbage collection (GC) behavior and code paths leading to \`runtime.scanobject\` to optimize memory allocations and possibly reduce GC work.
- Evaluate the use of decompression (\`flate.(*decompressor).huffmanBytesReader\`) and compression functions (\`flate.(*compressor).reset\`). Consider more efficient algorithms, reducing the data size, binary data formats that require less compression, or deferring workloads if possible.
- Further analysis on \`syscall.Syscall6\` to understand which system calls are being made and why they are frequent or slow. Depending on the underlying cause, this could lead to system configuration changes or different usage patterns of system resources.
- Audit and optimize the places where \`v1.(*Location).Reset\` and related reset functions are called, as this suggests clearing and reinitializing objects is time-consuming. Pooling and reusing objects could be beneficial.

For a precise diagnosis and targeted improvements, specific knowledge about the codebase and runtime environment (hardware, OS level, workload characteristics, etc.) is essential, and profiling results must be examined within the context of that environment."
`;
