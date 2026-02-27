import { expect, test } from "playwright-test-coverage";
import { basicInit, loginAsAdmin, loginAsFranchisee } from "./test_utils/test_utils";

test("create store", async ({ page }) => {
  await basicInit(page);
  await loginAsFranchisee(page);
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();

  // Create store
  await page.getByRole("button", { name: "Create store" }).click();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await page.getByRole("textbox", { name: "store name" }).fill("MyStore");
  await page.getByRole("button", { name: "Create" }).click();

  // Close store
  await page
    .getByRole("row", { name: "MyStore 0 ₿ Close" })
    .getByRole("button")
    .click();
  await expect(page.getByRole("heading")).toContainText("Sorry to see you go");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
});

test("create franchise", async ({ page }) => {
  await basicInit(page);
  await loginAsAdmin(page);
  await page
    .getByRole("link", { name: "Admin" })
    .click();

  // Create franchise
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).fill('MyFranchise');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('f@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  // Close franchise
  await page.getByRole('row', { name: 'TestFranchise pizza franchisee' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Close' }).click();
});
