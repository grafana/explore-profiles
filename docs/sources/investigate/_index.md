---
description: Investigate trends and spikes to identify issues.
canonical: https://grafana.com/docs/grafana/latest/explore/simplified-exploration/profiles/investigate/
keywords:
  - Profiles Drilldown
  - Concepts
title: Investigate trends and spikes
menuTitle: Investigate trends and spikes
weight: 600
---

# Investigate trends and spikes

Grafana Profiles Drilldown provides powerful tools that help you identify and analyze problems in your applications and services.

Using these steps, you can use the profile data to investigate issues.

{{< docs/play title="the Grafana Play site" url="https://play.grafana.org/a/grafana-pyroscope-app/profiles-explorer" >}}

## Explore your profile data

When you use Profiles Drilldown, your investigations follow these steps.

1. Verify your data source in the **Data source** drop-down.
1. Choose an **Exploration** type. **All services** is selected by default. Learn about the [available views](../choose-a-view/).<br />
   ![The All services view](/media/docs/explore-profiles/explore-profiles-homescreen.png)
1. Look for spikes or trends in the services to help identify issues. Use the **Profiles** drop-down to change profile types.<br />
   ![Select a profile type](/media/docs/explore-profiles/explore-profiles-select-profile.png)
1. After you identify the service to explore, you can change views:
   - Select **Profiles** to review the profiles for a service.
   - Select **Labels** to view the labels for a service. The Labels view helps you gain an understanding at an aggregated service level.
   - Select **Flame graph** to view the flame graph for a service.<br />
     ![Select an Exploration type to begin](/media/docs/explore-profiles/explore-profiles-exploration-bar.png)
1. Optional: Select filters to hone in on the problem areas. Each filter you select is added to the Filters statement at the top of the page. You can select filters in the following ways:
   - Use the filter drop-downs in the Filters bar to add labels and operators. Once completed, the filter is automatically applied.
   - From the Labels view: Select **Include** or **Exclude** from one of the areas of interest.<br />
     ![Add filters](/media/docs/explore-profiles/explore-profiles-labels-include-exclude.png)
1. Optional: Click and drag on any graph to select a specific time frame or data range.
1. Use the **Labels** view to select two processes to compare.
   - Select both the **Baseline** and **Comparison** checkboxes. Select **Compare** to view your selections in the **Diff flame graph** view.
   - Select both a time range in the baseline graph and in the comparison graph to view the diff flame graph.<br />
     ![Labels view](/media/docs/explore-profiles/explore-profiles-labels-compare.png)
1. Use the **Diff flame graph** view to drill into the code level to pinpoint issues in specific functions, for example.<br />
   ![Viewing a flame graph during an investigation](/media/docs/explore-profiles/explore-profiles-diff-flamegraph.png)
