import { expect, test } from "playwright-test-coverage";
import { basicInit, loginAs, mockUsers } from './test_utils/test_utils';

test("create store", async ({ page }) => {
  await basicInit(page);
  await loginAs(page, mockUsers.franchisee);
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();

  // Create store
  await page.getByRole('button', { name: 'Create store' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await page.getByRole('textbox', { name: 'store name' }).fill('MyStore');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('cell', { name: 'MyStore' })).toBeVisible();

  // Close store
  await page.getByRole('row', { name: 'MyStore 0 ₿ Close' }).getByRole('button').click();
  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('main')).toContainText('Everything you need to run');
});
