import { expect, test } from 'playwright-test-coverage';

test('home page', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/JWT Pizza/i);
});
