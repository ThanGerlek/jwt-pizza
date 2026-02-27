import { expect, test } from "playwright-test-coverage";
import {
  basicInit,
  loginAsDiner,
  loginAsFranchisee,
  loginAsAdmin,
  mockUsers,
} from "./test_utils/test_utils";

test("login as diner", async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);
});

test("register diner", async ({ page }) => {
  const user = mockUsers.diner;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill(user.name);
  await page.getByRole("textbox", { name: "Email address" }).fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Register" }).click();
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
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("main")).toContainText("Mama Ricci's kitchen");
});
