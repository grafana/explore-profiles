---
description: Determine your use case to begin your investigation
keywords:
  - Explore Profiles
  - Use case
title: Determine your use case
menuTitle: Determine your use case
weight: 400
---

# Determine your use case

When you start investigating an issue, you may either know what's wrong (for example, you know the affected service or that there’s too much CPU usage), or you may want to explore data.
This can lead you to two different starting points:

* Use case 1 - You know which service has issues and you need to investigate why.
* Use case 2 - You know there's a problem, but you need to locate where it is and the cause

Your use case determines what’s most important. If a service is misbehaving, then you might want to see the profile types so you can see the CPU and memory profiles alongside each other.

For either use case, the first step is to identify areas of interest by reviewing profiles or a single service.
Selecting different profile types lets you focus on memory allocation, CPU processes, allocation sizes, blocks, or blocks. 
The profile types available depend on how your app is instrumented to generate your profiling data.
For more information, refer to [Understand profile types](https://grafana.com/docs/pyroscope/latest/view-and-analyze-profile-data/profiling-types/).

After you’ve identified the problem process or service, you can filter and explore using labels and flame graphs to view lower levels.

## Use case 1: Know the problem service, not the cause

If you know the affected service (use case 1), your investigation starts by viewing that service using the **Services** view and reviewing the profiles for that service. In the first scenario, you may have identified that the `checkoutservice` has an issue. You can select `checkoutservice` and then use the **Profile types** view to examine all profiles for that service.

### Use case 2: Know there is an issue, need to investigate

If you only know there is an issue and have to investigate, then your investigation starts by using the **All services** view. Using the Profile selector, you can check the services’ CPU processes, memory allocation, blocks, locks, exceptions, and other available profile types.

After you locate the profile with a spike, select either **Profiles** to change to **Profile types** view and examine all profile types for that service, or select **Labels** to view the labels (such as `hostname` or `span_name`) for that service.

**Next step: [Investigate and identify issues](../investigate/)**
