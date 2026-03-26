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

When you use Profiles Drilldown, your investigations usually follow these steps.

1. Verify your data source in the **Data source** drop-down.
1. Choose an **Exploration** tab. **All services** is selected by default. Learn about the [available views](../choose-a-view/).

   ![The All services view](/media/docs/explore-profiles/v1.17.0/profiles-drilldown-homescreen-v1.17.0.png)
1. Look for spikes or trends in services to identify where to investigate. Use the **Profile type** drop-down to change profile metrics.

   ![Select a profile type](/media/docs/explore-profiles/v1.17.0/profiles-drilldown-select-profile-v1.17.0.png)
1. After you identify the service to explore, you can change views:
   - Select **Profile types** to review profile metrics for a service.
   - Select **Labels** to view labels for a service and refine the scope of your investigation.
   - Select **Flame graph** to view the flame graph for a service.

     ![Select an Exploration type to begin](/media/docs/explore-profiles/v1.17.0/profiles-drilldown-exploration-bar-v1.17.0.png)
1. Optional: Select filters to focus on problem areas. Each filter is added to the filter expression near the top of the page. You can add filters in the following ways:
   - Use filter selectors in the filter bar to add labels and operators.
   - In **Labels** view, use **Include** or **Exclude** on areas of interest.

   If **Labels** view shows no data, select a different service, profile type, or group-by label.

     ![Add filters](/media/docs/explore-profiles/v1.17.0/profiles-drilldown-labels-include-exclude-v1.17.0.png)
1. Optional: Click and drag on a chart to zoom to a smaller time range.
1. To compare two flame graphs, open **Diff flame graph**.
   - Configure **Baseline** and **Comparison** using time range selectors, label filters, and chart range selection.
   - Use **Auto-select** or choose a comparison preset to speed up setup.

     ![Labels view](/media/docs/explore-profiles/v1.17.0/profiles-drilldown-labels-compare-v1.17.0.png)
1. Use **Diff flame graph** to compare where relative time share changes between baseline and comparison, and then drill into functions to identify likely causes.

   ![Viewing a flame graph during an investigation](/media/docs/explore-profiles/v1.17.0/profiles-drilldown-diff-flamegraph-v1.17.0.png)

## Common tools during investigations

In the Profiles toolbar, you can also use these features while investigating:

- **Upload ad hoc profiles** to load profile data for one-off analysis.
- **Copy shareable link** to capture the current investigation state and share it with teammates.
- **View/edit tenant settings** to adjust settings such as collapsed flame graphs, function details, and maximum node count.
