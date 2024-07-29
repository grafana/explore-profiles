## [0.1.5](https://github.com/grafana/explore-profiles/compare/v0.1.4...v0.1.5) (2024-07-29)


### Features

* **Labels:** Various UI/UX improvements ([#93](https://github.com/grafana/explore-profiles/issues/93)) ([bddad3c](https://github.com/grafana/explore-profiles/commit/bddad3cf21e6e1459eed03167c8c6f6d24e802d4))
* Revamp exploration type selector ([#94](https://github.com/grafana/explore-profiles/issues/94)) ([60dab67](https://github.com/grafana/explore-profiles/commit/60dab67af27f7ec72a3e9de11885f901937c23ed))



## [0.1.4](https://github.com/grafana/explore-profiles/compare/v0.1.3...v0.1.4) (2024-07-25)


### Bug Fixes

* **Onboarding:** Handle gracefully when there's no data source configured ([#76](https://github.com/grafana/explore-profiles/issues/76)) ([4c18444](https://github.com/grafana/explore-profiles/commit/4c1844498d8b3bde4bb5b30ac889419b7462fb8b))
* **PanelTitle:** Remove series count when only 1 serie ([#78](https://github.com/grafana/explore-profiles/issues/78)) ([8422e6d](https://github.com/grafana/explore-profiles/commit/8422e6d2b2d8e21d0178ed20599ce13e16194da5))
* **SceneByVariableRepeaterGrid:** Prevent extra renders ([#86](https://github.com/grafana/explore-profiles/issues/86)) ([bf14755](https://github.com/grafana/explore-profiles/commit/bf1475580f68beec434287283d079d0fed250cad))


### Features

* Avoid no data panels ([#80](https://github.com/grafana/explore-profiles/issues/80)) ([72120b7](https://github.com/grafana/explore-profiles/commit/72120b7c4020017ed0479131ef0ddb7b5620d517))
* **LabelsExploration:** Introduce bar gauge visualisations ([#72](https://github.com/grafana/explore-profiles/issues/72)) ([7b1b19a](https://github.com/grafana/explore-profiles/commit/7b1b19a81e0ca6825bae9f2b06795199f4c9d209))
* **SceneLabelValuesTimeseries:** Colors and legends are preserved on expanded timeseries ([#85](https://github.com/grafana/explore-profiles/issues/85)) ([6980299](https://github.com/grafana/explore-profiles/commit/69802997b1a5fc72938bb0eaaf27e99076980f7a))
* Various enhancements after first UX interview ([#81](https://github.com/grafana/explore-profiles/issues/81)) ([2cdfcbe](https://github.com/grafana/explore-profiles/commit/2cdfcbecae5b1bd74310a3cbd8a115bc1e166525))



## [0.1.3](https://github.com/grafana/explore-profiles/compare/v0.1.2...v0.1.3) (2024-07-19)


### Bug Fixes

* **Header:** Switch the exploration type radio button group to a select on narrow screens ([#70](https://github.com/grafana/explore-profiles/issues/70)) ([55f420a](https://github.com/grafana/explore-profiles/commit/55f420a532ee8f2d6d955112d2dd4665df18cf67))



## [0.1.2](https://github.com/grafana/explore-profiles/compare/v0.0.46-explore-profiles-beta-35...v0.1.2) (2024-07-17)


### Bug Fixes

* **CompareAction:** Add missing data source query parameter to compare URL ([#58](https://github.com/grafana/explore-profiles/issues/58)) ([b1213e1](https://github.com/grafana/explore-profiles/commit/b1213e13aad71f11bbd8473571b4d9ae37924b8f))
* **FunctionDetails:** Get timeline state from Flame Graph component ([#25](https://github.com/grafana/explore-profiles/issues/25)) ([64ed0e6](https://github.com/grafana/explore-profiles/commit/64ed0e68a22445111b1d1ec02dff9b2fd8daecaa))
* **GitHub Integration:** Correctly extract the start/end timestamps from time picker ([#15](https://github.com/grafana/explore-profiles/issues/15)) ([fe8d807](https://github.com/grafana/explore-profiles/commit/fe8d807a83fce1b3b3b1eeb39d980af0312548bb))
* **SceneAllLabelValuesTableState:** Fix color contrast in light mode ([#26](https://github.com/grafana/explore-profiles/issues/26)) ([1bd268f](https://github.com/grafana/explore-profiles/commit/1bd268fd2bf2236ed9b6853e6d48a17933107bf5))
* **SceneByVariableRepeaterGrid:** Set timeseries min to 0 ([#31](https://github.com/grafana/explore-profiles/issues/31)) ([0e3a17d](https://github.com/grafana/explore-profiles/commit/0e3a17df3363cb2b61bab85039522e44eb766c61))
* **SceneFlameGraph:** Fix runtime error ([#45](https://github.com/grafana/explore-profiles/issues/45)) ([6227f2d](https://github.com/grafana/explore-profiles/commit/6227f2dcb1d705259fb1ad8ae9f144eb17cd80b1))
* **SceneFlameGraph:** Respect maxNodes when set in the URL ([#29](https://github.com/grafana/explore-profiles/issues/29)) ([85dd5b7](https://github.com/grafana/explore-profiles/commit/85dd5b79833f1737c0cf5505b743e50e256a20dc))


### Features

* **Analytics:** Track Explore Profiles actions ([#64](https://github.com/grafana/explore-profiles/issues/64)) ([ec58f57](https://github.com/grafana/explore-profiles/commit/ec58f5771c6ff59fcbd444ac62c2e55dd1bda202))
* **DataSource:** Store selected data source in local storage ([#60](https://github.com/grafana/explore-profiles/issues/60)) ([9f7ede1](https://github.com/grafana/explore-profiles/commit/9f7ede188279010502f2bcef02b2caba94b5064f))
* **SingleView:** Remove page ([#20](https://github.com/grafana/explore-profiles/issues/20)) ([16da70d](https://github.com/grafana/explore-profiles/commit/16da70d7f424c17982a8ca1ceab24a2589121007))
* Update plugin metadata to auto enable ([#65](https://github.com/grafana/explore-profiles/issues/65)) ([3afd1cd](https://github.com/grafana/explore-profiles/commit/3afd1cd6cbdaf93583978ecab80af8a620e313ef))
* Various minor improvements ([#46](https://github.com/grafana/explore-profiles/issues/46)) ([877b009](https://github.com/grafana/explore-profiles/commit/877b0094ffd21794b5742db6fbfb32ebd5868a4c))



# [0.1.0](https://github.com/grafana/explore-profiles/compare/v0.0.46-explore-profiles-beta-35...v0.1.0) (2024-07-15)

Explore Profiles is now available in its initial public release. It is designed to offer a seamless, query-less experience for browsing and analyzing profiling data.

Key features include:

- **Native integration with Pyroscope**: Seamlessly integrates with Pyroscope backend to provide detailed performance profiling and analysis.
- **Query-Less Browsing**: Navigate profiling data without the need for complex queries.
- **AI-Powered flame graph analysis**: uses a large-language model (LLM) to assist with flame graph data interpretation so you can identify bottlenecks, and get to the bottom of performance issues faster.

### Bug Fixes

- **GitHub Integration:** Correctly extract the start/end timestamps from time picker ([#15](https://github.com/grafana/explore-profiles/issues/15)) ([fe8d807](https://github.com/grafana/explore-profiles/commit/fe8d807a83fce1b3b3b1eeb39d980af0312548bb))
- **SceneAllLabelValuesTableState:** Fix color contrast in light mode ([#26](https://github.com/grafana/explore-profiles/issues/26)) ([1bd268f](https://github.com/grafana/explore-profiles/commit/1bd268fd2bf2236ed9b6853e6d48a17933107bf5))
- **SceneByVariableRepeaterGrid:** Set timeseries min to 0 ([#31](https://github.com/grafana/explore-profiles/issues/31)) ([0e3a17d](https://github.com/grafana/explore-profiles/commit/0e3a17df3363cb2b61bab85039522e44eb766c61))
- **SceneFlameGraph:** Fix runtime error ([#45](https://github.com/grafana/explore-profiles/issues/45)) ([6227f2d](https://github.com/grafana/explore-profiles/commit/6227f2dcb1d705259fb1ad8ae9f144eb17cd80b1))
- **SceneFlameGraph:** Respect maxNodes when set in the URL ([#29](https://github.com/grafana/explore-profiles/issues/29)) ([85dd5b7](https://github.com/grafana/explore-profiles/commit/85dd5b79833f1737c0cf5505b743e50e256a20dc))

### Features

- Bump version to 0.1.0 ([3e480f9](https://github.com/grafana/explore-profiles/commit/3e480f90c06cba6d9ac3558026a1c892963db4c6))
- **SingleView:** Remove page ([#20](https://github.com/grafana/explore-profiles/issues/20)) ([16da70d](https://github.com/grafana/explore-profiles/commit/16da70d7f424c17982a8ca1ceab24a2589121007))
- Various minor improvements ([#46](https://github.com/grafana/explore-profiles/issues/46)) ([877b009](https://github.com/grafana/explore-profiles/commit/877b0094ffd21794b5742db6fbfb32ebd5868a4c))
