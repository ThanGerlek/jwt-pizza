import { expect, test } from "playwright-test-coverage";
import {
  basicInit,
  loginAsDiner,
  loginAsFranchisee,
  loginAsAdmin,
} from "./test_utils/test_utils";

test("login as diner", async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);
});

test("login as franchisee", async ({ page }) => {
  await basicInit(page);
  await loginAsFranchisee(page);
});

test("franchisee dashboard", async ({ page }) => {
  await basicInit(page);
  await loginAsFranchisee(page);
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();
  await expect(page.getByRole("main")).toContainText(
    "Everything you need to run",
  );
});

test("login as admin", async ({ page }) => {
  await basicInit(page);
  await loginAsAdmin(page);
});

test("admin dashboard", async ({ page }) => {
  await basicInit(page);
  await loginAsAdmin(page);
  await page.getByRole("button", { name: "Admin" }).click();
  await expect(page.getByRole("main")).toContainText("Mama Ricci's kitchen");
});
