---
title: Understand profiling types and their uses in Pyroscope
menuTitle: Understand profiling types
description: Learn about the different profiling types available in Pyroscope and how to effectively use them in your application performance analysis.
weight: 300
keywords:
  - profiles
  - profiling types
  - application performance
  - flame graphs
---

# Understand profiling types and their uses in Pyroscope

{{< docs/shared source="pyroscope" lookup="intro/continuous-profiling.md" version="<PYROSCOPE_VERSION>" >}}

Profiling is an essential tool for understanding and optimizing application performance. In Pyroscope, various profiling types allow for an in-depth analysis of different aspects of your application. This guide explores these types and explain their impact on your program.

## Profiling types

In Pyroscope, profiling types refer to different dimensions of application performance analysis, focusing on specific aspects like CPU usage, memory allocation, or thread synchronization.

[//]: # 'Shared content for available profile types'
[//]: # 'This content is located in /pyroscope/docs/sources/shared/available-profile-types.md'

{{< docs/shared source="pyroscope" lookup="available-profile-types.md" version="latest" >}}

Refer to the Profile types tables for information on supported profile types based on instrumentation method.

For information on auto-instrumentation and supported language SDKs, refer to [Configure the client](https://grafana.com/docs/pyroscope/<PYROSCOPE_VERSION>/configure-client/).

<!-- Description of profiling types -->

[//]: # 'Shared content for profile type explanations.'
[//]: # 'This content is located in /pyroscope/docs/sources/shared/intro/profile-types-descriptions.md'
