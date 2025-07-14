import { ExplorationType, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.beforeEach(async ({ settingsPage }) => {
  await settingsPage.goto();
});

test.afterEach(async ({ settingsPage }) => {
  await settingsPage.resetTestSettings(false);
});

test.describe('Plugin Settings', () => {
  // prevents unwanted settings modifications while running multiple tests in parallel
  test.describe.configure({ mode: 'serial' });

  test('Main UI elements', async ({ settingsPage }) => {
    const flamegraphSettings = settingsPage.getFlamegraphSettings();

    await expect(flamegraphSettings).toBeVisible();
    await expect(flamegraphSettings.getByText('Collapsed flame graphs')).toBeVisible();
    await expect(flamegraphSettings.getByText('Maximum number of nodes')).toBeVisible();
  });

  test.describe('Metrics from profiles settings', () => {
    test('is not available by default', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      await expect(exploreProfilesPage.recordingRulesButton).not.toBeVisible();

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 10 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).not.toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).not.toBeVisible();
    });

    test('can be enabled', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);
      await expect(exploreProfilesPage.recordingRulesButton).toBeVisible();

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 10 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).toBeVisible();
    });

    test('create a recording rule for all services', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.AllServices);
      await expect(exploreProfilesPage.recordingRulesButton).toBeVisible();
      await exploreProfilesPage.clickOnViewRecordingRulesButton();
      await expect(exploreProfilesPage.addRecordingRuleButton).toBeVisible();
      await exploreProfilesPage.clickOnAddRecordingRuleButton();

      await expect(exploreProfilesPage.recordingRulesModalServiceName).toContainText('All services');
    });

    test('create a recording rule for a single service', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.ProfileTypes);
      await expect(exploreProfilesPage.recordingRulesButton).toBeVisible();
      await exploreProfilesPage.clickOnViewRecordingRulesButton();
      await expect(exploreProfilesPage.addRecordingRuleButton).toBeVisible();
      await exploreProfilesPage.clickOnAddRecordingRuleButton();

      await expect(exploreProfilesPage.recordingRulesModalServiceName).toContainText('ride-sharing-app');
    });

    test('function name field shows correct placeholder and can be filled', async ({
      settingsPage,
      exploreProfilesPage,
    }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 10 });
      await exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule').click();

      // Check function name field has correct placeholder
      await exploreProfilesPage.assertRecordingRuleFormFunctionNamePlaceholder('Leave empty for total aggregation');

      // Fill form with function name
      await exploreProfilesPage.fillRecordingRuleForm({
        metricName: 'test_function_metric',
        functionName: 'main.processRequest',
      });

      await exploreProfilesPage.assertRecordingRuleFormFunctionName('main.processRequest');
    });

    test('can create recording rule from any flame graph block with function name', async ({
      settingsPage,
      exploreProfilesPage,
    }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      // Click on a non-root flame graph block
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 300, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).toBeVisible();

      await exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule').click();

      // Verify modal opened with potentially pre-filled function name
      await expect(exploreProfilesPage.getByTestId('Create recording rule modal')).toBeVisible();

      // Fill the metric name
      await exploreProfilesPage.fillRecordingRuleForm({
        metricName: 'test_function_specific_metric',
      });

      await exploreProfilesPage.submitRecordingRuleForm();

      // Should redirect to recording rules page or close modal
      await expect(exploreProfilesPage.getByTestId('Create recording rule modal')).not.toBeVisible();
    });

    test('recording rules table displays function name column correctly', async ({
      settingsPage,
      exploreProfilesPage,
    }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      // Create a rule without function name (total aggregation)
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 10 });
      await exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule').click();
      await exploreProfilesPage.fillRecordingRuleForm({
        metricName: 'test_total_metric',
      });
      await exploreProfilesPage.submitRecordingRuleForm();

      // Go to recording rules page and verify the table shows function name column
      await exploreProfilesPage.goToRecordingRulesPage();

      // Check that the table has the Function Name column header
      const table = exploreProfilesPage.getRecordingRulesTable();
      await expect(table.locator('th')).toContainText(['Function Name']);

      // Check that the rule shows "Total (all functions)" for rules without function name
      await exploreProfilesPage.assertRecordingRuleInTable('test_total_metric');
    });

    test('can create recording rule with specific function name and verify in table', async ({
      settingsPage,
      exploreProfilesPage,
    }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 300, y: 50 });
      await exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule').click();

      // Create rule with specific function name
      await exploreProfilesPage.fillRecordingRuleForm({
        metricName: 'test_specific_function_metric',
        functionName: 'com.example.Service.process',
      });
      await exploreProfilesPage.submitRecordingRuleForm();

      // Go to recording rules page and verify the function name is displayed
      await exploreProfilesPage.goToRecordingRulesPage();
      await exploreProfilesPage.assertRecordingRuleInTable(
        'test_specific_function_metric',
        'com.example.Service.process'
      );
    });
  });

  test.describe('Flame graph settings', () => {
    test('Can be modified', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.getCollapsedFlamegraphsCheckbox().click();
      await settingsPage.getMaxNodesInput().fill('4');
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      // flame graph
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand group')).toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand all groups')).toBeVisible();

      await exploreProfilesPage.closeFlameGraphContextualMenu();

      // tweak max diff pixel ratio because sometimes the screenshot is 1px bigger in height
      await expect(exploreProfilesPage.getFlamegraph()).toHaveScreenshot({ maxDiffPixelRatio: 0.02 });

      // diff flame graph
      await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand group')).toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand all groups')).toBeVisible();

      await exploreProfilesPage.closeFlameGraphContextualMenu();

      // tweak max diff pixel ratio because sometimes the screenshot is 1px bigger in height
      await expect(exploreProfilesPage.getFlamegraph()).toHaveScreenshot({
        maxDiffPixelRatio: 0.02,
      });
    });
  });
});
