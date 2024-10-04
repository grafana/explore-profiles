## [0.1.12](https://github.com/grafana/explore-profiles/compare/v0.1.11...v0.1.12) (2024-10-04)


### Bug Fixes

* **Code:** do not show Optimize Code button when no code is available ([#208](https://github.com/grafana/explore-profiles/issues/208)) ([6af234d](https://github.com/grafana/explore-profiles/commit/6af234d6a4fec65a1c51adf9439cd28802462173))
* **Filters:** ensure "is empty" filter is synced with URL ([#205](https://github.com/grafana/explore-profiles/issues/205)) ([8fc8fc4](https://github.com/grafana/explore-profiles/commit/8fc8fc4fdc31860cd1d1def3ca7f603ffe5b10fe))
* **QueryBuilder:** Filters with regex values can be edited in place ([#207](https://github.com/grafana/explore-profiles/issues/207)) ([75de5e2](https://github.com/grafana/explore-profiles/commit/75de5e291cb46930e18e7f41fef6166ec69fa341))


### Features

* Minor improvements ([#211](https://github.com/grafana/explore-profiles/issues/211)) ([0486f33](https://github.com/grafana/explore-profiles/commit/0486f338404915525f53ae26b9723ac0455e216a))
* **QueryBuilder:** Enable "in"/"not in" operators ([#122](https://github.com/grafana/explore-profiles/issues/122)) ([9574828](https://github.com/grafana/explore-profiles/commit/9574828fead1168e0d143de49357f5997c5eaf5f))
* **StatsPanel:** Add title on hover value + vertical border to separate compare actions ([#212](https://github.com/grafana/explore-profiles/issues/212)) ([71a29e5](https://github.com/grafana/explore-profiles/commit/71a29e506596d3f9207cab2ae9f658ff079c088e))



## [0.1.11](https://github.com/grafana/explore-profiles/compare/v0.1.10...v0.1.11) (2024-09-30)


### Features

* Minor UI improvements (timeseries point size, plugin info tooltip) ([#194](https://github.com/grafana/explore-profiles/issues/194)) ([621982a](https://github.com/grafana/explore-profiles/commit/621982a990c320594c6764e1ce035aacde652ac8))
* **QuickFilter:** Add results count ([#193](https://github.com/grafana/explore-profiles/issues/193)) ([dc4012d](https://github.com/grafana/explore-profiles/commit/dc4012d39aed84561fb7d14726e426aad95544b6))



## [0.1.10](https://github.com/grafana/explore-profiles/compare/v0.1.9...v0.1.10) (2024-09-25)



## [0.1.9](https://github.com/grafana/explore-profiles/compare/v0.1.8...v0.1.9) (2024-09-17)


### Bug Fixes

* **DiffFlameGraph:** Remove non-working pprof export ([#169](https://github.com/grafana/explore-profiles/issues/169)) ([662cd48](https://github.com/grafana/explore-profiles/commit/662cd488ae7a41e4843ca66694743d4777ac1230))
* **ExplainFlameGraph:** Add tooltip when the LLM plugin is not installed ([#163](https://github.com/grafana/explore-profiles/issues/163)) ([d395391](https://github.com/grafana/explore-profiles/commit/d3953913be2b072ddac8413fd9341a43dc4f865e))
* **Faro:** Fix Faro SDK config ([#174](https://github.com/grafana/explore-profiles/issues/174)) ([3ed6362](https://github.com/grafana/explore-profiles/commit/3ed636207927c0423cbca8c40444ba57cd6885b2))
* Fix useUrlSearchParams ([#171](https://github.com/grafana/explore-profiles/issues/171)) ([179b060](https://github.com/grafana/explore-profiles/commit/179b0608d5d99fa5370dcee52c8431259de1da1f))
* **LabelsDataSource:** Limit the maximum number of concurrent requests to fetch label values ([#165](https://github.com/grafana/explore-profiles/issues/165)) ([cb8149c](https://github.com/grafana/explore-profiles/commit/cb8149c36f4f40502b62d1f4ed96c46ea10a2c65))


### Features

* Add give feeback button and preview badge ([#167](https://github.com/grafana/explore-profiles/issues/167)) ([a23fa61](https://github.com/grafana/explore-profiles/commit/a23fa61b8982b0c8877a0b70ecab26747d1e4fa0))
* **AppHeader:** Add Settings button ([#172](https://github.com/grafana/explore-profiles/issues/172)) ([9d7fb6b](https://github.com/grafana/explore-profiles/commit/9d7fb6b08b9bea0cfebe6a74c883d8ff92cc9ad9))
* Remove legacy comparison views code ([#143](https://github.com/grafana/explore-profiles/issues/143)) ([816363f](https://github.com/grafana/explore-profiles/commit/816363faea2dcbf10789bb68a50b3e85947fc2a4))
* Upgrade Grafana to v11.2.0 ([#173](https://github.com/grafana/explore-profiles/issues/173)) ([15680e6](https://github.com/grafana/explore-profiles/commit/15680e6b810f7771e9a874b0cacd6d093403354d))



## [0.1.8](https://github.com/grafana/explore-profiles/compare/v0.1.6...v0.1.8) (2024-09-11)


### Bug Fixes

* **Labels:** Fix error with bar gauges viz and new Grafana version ([#159](https://github.com/grafana/explore-profiles/issues/159)) ([b527961](https://github.com/grafana/explore-profiles/commit/b52796103af9db785d681fdac22bf6d751a7f734))


### Features

* Add histogram visualizations ([#141](https://github.com/grafana/explore-profiles/issues/141)) ([2265be7](https://github.com/grafana/explore-profiles/commit/2265be70ea67cfdc44aad33e1a1f7951076db815))
* create new browser history entry on some user actions  ([#128](https://github.com/grafana/explore-profiles/issues/128)) ([5439ab3](https://github.com/grafana/explore-profiles/commit/5439ab32f0e4a21f3affbe6bfbe12da7cacd12b1))
* **DiffFlameGraph:** Add flame graph range in timeseries legend ([#140](https://github.com/grafana/explore-profiles/issues/140)) ([8729c31](https://github.com/grafana/explore-profiles/commit/8729c31dddf383d2d6ca4c2178397045c31d9654))
* **GitHubIntegration:** Migrate GitHub integration to Scenes ([#142](https://github.com/grafana/explore-profiles/issues/142)) ([0386bbc](https://github.com/grafana/explore-profiles/commit/0386bbc369538763c69fce1cc07a45fb82619beb))
* support submodules for GitHub Integration ([#147](https://github.com/grafana/explore-profiles/issues/147)) ([52ecea8](https://github.com/grafana/explore-profiles/commit/52ecea89b5a436b3dc03ff352127f55ea315e037))



## [0.1.7](https://github.com/grafana/explore-profiles/compare/v0.1.6...v0.1.7) (2024-08-29)


### Features

* Add histogram visualizations ([#141](https://github.com/grafana/explore-profiles/issues/141)) ([2265be7](https://github.com/grafana/explore-profiles/commit/2265be70ea67cfdc44aad33e1a1f7951076db815))
* create new browser history entry on some user actions  ([#128](https://github.com/grafana/explore-profiles/issues/128)) ([5439ab3](https://github.com/grafana/explore-profiles/commit/5439ab32f0e4a21f3affbe6bfbe12da7cacd12b1))
* **DiffFlameGraph:** Add flame graph range in timeseries legend ([#140](https://github.com/grafana/explore-profiles/issues/140)) ([8729c31](https://github.com/grafana/explore-profiles/commit/8729c31dddf383d2d6ca4c2178397045c31d9654))
* **GitHubIntegration:** Migrate GitHub integration to Scenes ([#142](https://github.com/grafana/explore-profiles/issues/142)) ([0386bbc](https://github.com/grafana/explore-profiles/commit/0386bbc369538763c69fce1cc07a45fb82619beb))



## [0.1.6](https://github.com/grafana/explore-profiles/compare/v0.1.5...v0.1.6) (2024-08-27)


### Bug Fixes

* **Ci:** Fix docker compose commands ([#111](https://github.com/grafana/explore-profiles/issues/111)) ([4ee541a](https://github.com/grafana/explore-profiles/commit/4ee541acbe822d92abfc9344eda4611600b1476e))
* **DiffFlameGraph:** Fix the "Explain Flame Graph" (AI) feature ([#129](https://github.com/grafana/explore-profiles/issues/129)) ([a40c02b](https://github.com/grafana/explore-profiles/commit/a40c02b7c37ac309d878689c5929ef770900d6f5))
* **Favorites:** Render "No results" when there are no favorites ([#101](https://github.com/grafana/explore-profiles/issues/101)) ([426469d](https://github.com/grafana/explore-profiles/commit/426469d239b9ac86ad7e6fe4a21385836926a264))
* **Labels:** Fix "Discarded by user" error in the UI ([#110](https://github.com/grafana/explore-profiles/issues/110)) ([2e9baab](https://github.com/grafana/explore-profiles/commit/2e9baab391168022f4de7bf3933e8ba4baac95df))
* **SceneLabelValuePanel:** Fix border color when baseline/comparison is selected ([#123](https://github.com/grafana/explore-profiles/issues/123)) ([5b4058a](https://github.com/grafana/explore-profiles/commit/5b4058a90ac6f713d50c9686813f273233dc4a39))
* **ScenesProfileExplorer:** Make labels more responsive on smaller screens ([10c97dc](https://github.com/grafana/explore-profiles/commit/10c97dc69714a6a0f97bbaa086dd7263e8e72950))


### Features

* **CompareView:** Implement new Comparison view with Scenes ([#119](https://github.com/grafana/explore-profiles/issues/119)) ([127d6c3](https://github.com/grafana/explore-profiles/commit/127d6c3f952d1e679bcb29c6e2d62ca9d1eed51f))
* **FlameGraph:** Add missing export menu ([#132](https://github.com/grafana/explore-profiles/issues/132)) ([f57b0ca](https://github.com/grafana/explore-profiles/commit/f57b0ca5329b0b2a7e58f7387391299475ddc952))
* **Labels:** Improve comparison flow ([#117](https://github.com/grafana/explore-profiles/issues/117)) ([31d0632](https://github.com/grafana/explore-profiles/commit/31d06326fa9e82a906635ac371a9e206cfa2bb54))
* **Timeseries:** Add total resource consumption in legend ([#108](https://github.com/grafana/explore-profiles/issues/108)) ([1fbb2df](https://github.com/grafana/explore-profiles/commit/1fbb2dfbc1d0a5d837afa74c4783171aded0258a))



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
