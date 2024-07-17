---
cascade:
  FULL_PRODUCT_NAME: Grafana Explore Profiles
  PRODUCT_NAME: Explore Profiles
description: Learn how to use Explore Profiles to understand and troubleshoot
  your applications and services.
keywords:
  - Explore Profiles
  - Profiles
title: Explore Profiles
menuTitle: Explore Profiles
weight: 100
hero:
  title: Explore Profiles
  level: 1
  width: 100
  height: 100
  description: Use Explore Profiles to investigate and identify issues using profiling data.
cards:
  title_class: pt-0 lh-1
  items:
    - title: Concepts
      href: ./concepts/
      description: Learn the concepts you need to understand to use profiling.
      height: 24
    - title: Get started
      href: ./get-started/
      description: How do you use profiling data to investigate an issue? Start here.
      height: 24
    - title: Determine your use case
      href: ./troubleshooting/
      description: Find solutions to common issues you might encounter when using Explore Logs.
      height: 24
    - title: Choose a view
      href: ./choose-a-view/
      description: Which exploration type view best fits the issue you are investigating?
      height: 24
    - title: Investigate trends and spikes
      href: ./investigate/
      description: Use your profiling data to identify issues and determine the root cause.
      height: 24
---

<!-- Use this for the product name {{< param "PRODUCT_NAME" >}} -->

# Explore Profiles

Profiling is a technique used in software development to measure and analyze the runtime behavior of a program.
By profiling a program, developers can identify which parts of the program consume the most resources, such as CPU time, memory, or I/O operations.
You can use this information to optimize the program, making it run faster or use fewer resources.

Explore Profiles provides an intuitive interface for exploring your profile data.
This design lets you navigate the UI and drill down into which tags are most interesting to you.
This app helps you start at the highest level possible and drill down into a specific root cause analysis.
You don’t know what’s wrong, but you should be able to find it by drilling down.

Using Explore Profiles, you can:

* View high-level service performance: Get a high-level view of all of your services and how they're functioning
* Optimize processes: Identify processes or services that you can optimize for better performance
* Diagnose issues: Determine the root cause of an issue

## Explore

{{< card-grid key="cards" type="simple" >}}
