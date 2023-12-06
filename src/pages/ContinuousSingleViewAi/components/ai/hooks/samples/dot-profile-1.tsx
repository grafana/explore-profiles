export default `
digraph "pyroscope" {
  node [style=filled fillcolor="#f8f8f8"]
  subgraph cluster_L { "File: pyroscope" [shape=box fontsize=16 label="File: pyroscope\lType: cpu\lTime: Nov 30, 2023 at 6:47pm (+08)\lShowing nodes accounting for 5703.08s, 54.47% of 10469.32s total\lDropped 1167 nodes (cum <= 52.35s)\lDropped 19 edges (freq <= 10.47s)\lShowing top 30 nodes out of 285\l\lSee https://git.io/JfYMW for how to read the graph\l" ] }
  N4 [label="pprof\nFromBytes\n1.33s (0.013%)\nof 4664.01s (44.55%)" id="node4" fontsize=9 shape=box ]
  N5 [label="connect-go\nNewUnaryHandler[go\nshape\nstruct { github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nstate google\ngolang\norg/protobuf/internal/impl\nMessageState; github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nsizeCache int32; github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nunknownFields []uint8; Series []*github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nRawProfileSeries \"protobuf:\\\"bytes,1,rep,name=series,proto3\\\" json:\\\"series,omitempty\\\"\" },go\nshape\nstruct { github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nstate google\ngolang\norg/protobuf/internal/impl\nMessageState; github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nsizeCache int32; github\ncom/grafana/pyroscope/api/gen/proto/go/push/v1\nunknownFields []uint8 }]\nfunc2\n6.69s (0.064%)\nof 5543.05s (52.95%)" id="node5" fontsize=9 shape=box ]
  N6 [label="symdb\n(*PartitionWriter)\nWriteProfileSymbols\n45.99s (0.44%)\nof 1865.50s (17.82%)" id="node6" fontsize=10 shape=box ]
  N9 [label="v1\n(*Profile)\nResetVT\n79.87s (0.76%)\nof 1284.04s (12.26%)" id="node9" fontsize=11 shape=box ]
  N12 [label="symdb\n\ningest\n76.10s (0.73%)\nof 1210.09s (11.56%)" id="node12" fontsize=11 shape=box ]
  N13 [label="pprof\nRawFromBytes\n0.70s (0.0067%)\nof 1209.36s (11.55%)" id="node13" fontsize=9 shape=box ]
  N17 [label="flate\n(*compressor)\nreset\n561.54s (5.36%)\nof 561.64s (5.36%)" id="node17" fontsize=15 shape=box ]
  N18 [label="v1\n(*Profile)\nUnmarshalVT\n68.76s (0.66%)\nof 603.24s (5.76%)" id="node18" fontsize=11 shape=box ]
  N19 [label="runtime\nmcall\n2.24s (0.021%)\nof 509.25s (4.86%)" id="node19" fontsize=9 shape=box ]
  N20 [label="phlaredb\n(*Head)\nIngest\n3.60s (0.034%)\nof 2155.02s (20.58%)" id="node20" fontsize=9 shape=box ]
  N21 [label="impl\n(*messageState)\nStoreMessageInfo\n51.54s (0.49%)\nof 709.97s (6.78%)" id="node21" fontsize=11 shape=box ]
  N22 [label="runtime\nmapassign_fast64\n78.93s (0.75%)\nof 387.90s (3.71%)" id="node22" fontsize=11 shape=box ]
  N23 [label="v1\n(*Location)\nReset\n199.80s (1.91%)\nof 602.45s (5.75%)" id="node23" fontsize=12 shape=box ]
  N24 [label="symdb\n(*PartitionWriter)\nconvertSamples\n29.51s (0.28%)\nof 434.17s (4.15%)" id="node24" fontsize=10 shape=box ]
  N25 [label="http2\n(*serverConn)\nserve\n7.09s (0.068%)\nof 555.21s (5.30%)" id="node25" fontsize=9 shape=box ]
  N26 [label="bufio\n(*Writer)\nFlush\n10.15s (0.097%)\nof 383.12s (3.66%)" id="node26" fontsize=9 shape=box ]
  N27 [label="runtime\nsystemstack\n0.76s (0.0073%)\nof 967.93s (9.25%)" id="node27" fontsize=9 shape=box ]
  N28 [label="syscall\nSyscall\n1.24s (0.012%)\nof 485.18s (4.63%)" id="node28" fontsize=9 shape=box ]
  N29 [label="flate\n(*decompressor)\nhuffmanBytesReader\n300.65s (2.87%)\nof 480.38s (4.59%)" id="node29" fontsize=13 shape=box ]
  N30 [label="runtime\nscanobject\n150.74s (1.44%)\nof 653.48s (6.24%)" id="node30" fontsize=12 shape=box ]
  N1 [label="http\nHandlerFunc\nServeHTTP\n3.57s (0.034%)\nof 7108.10s (67.89%)" id="node1" fontsize=9 shape=box ]
  N3 [label="http2\n(*serverConn)\nrunHandler\n2.61s (0.025%)\nof 6518.81s (62.27%)" id="node3" fontsize=9 shape=box ]
  N7 [label="mux\n(*Router)\nServeHTTP\n1.51s (0.014%)\nof 5883.83s (56.20%)" id="node7" fontsize=9 shape=box ]
  N8 [label="runtime\nmallocgc\n139.52s (1.33%)\nof 549.90s (5.25%)" id="node8" fontsize=12 shape=box ]
  N10 [label="nethttp\nMiddlewareFunc\nfunc5\n7.44s (0.071%)\nof 6551.26s (62.58%)" id="node10" fontsize=9 shape=box ]
  N11 [label="util\n(*Log)\nWrap\nLog\nWrap\nfunc1\n3.29s (0.031%)\nof 6266.17s (59.85%)" id="node11" fontsize=9 shape=box ]
  N14 [label="runtime\nnewobject\n33.58s (0.32%)\nof 332.60s (3.18%)" id="node14" fontsize=10 shape=box ]
  N15 [label="runtime\nselectgo\n45.49s (0.43%)\nof 478.75s (4.57%)" id="node15" fontsize=10 shape=box ]
  N16 [label="syscall\nSyscall6\n502.84s (4.80%)" id="node16" fontsize=15 shape=box ]
  N1 -> N10
  N3 -> N1
  N10 -> N1
  N1 -> N11
  N11 -> N1
  N1 -> N7
  N7 -> N5
  N5 -> N4
  N4 -> N20
  N20 -> N6
  N4 -> N9
  N6 -> N12
  N4 -> N13
  N27 -> N30
  N13 -> N18
  N9 -> N23
  N5 -> N17
  N1 -> N25
  N13 -> N29
  N28 -> N16
  N6 -> N24
  N12 -> N22
  N9 -> N21
  N23 -> N21
  N25 -> N15
  N1 -> N2
  N15 -> N27
  N26 -> N28
  N25 -> N2
  N7 -> N1
  N8 -> N2
  N5 -> N2
  N18 -> N8
  N14 -> N8
  N20 -> N2
  N11 -> N2
  N10 -> N2
  N3 -> N26
  N12 -> N2
  N19 -> N2
  N15 -> N2
  N14 -> N2
  N6 -> N14
  N27 -> N2
  N18 -> N14
  N22 -> N8
  N26 -> N15
  N11 -> N28
  N19 -> N16
  N5 -> N15
  N28 -> N2
  N24 -> N14
  N25 -> N14
}
`;
