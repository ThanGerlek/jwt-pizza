import { expect, test } from "playwright-test-coverage";
import { loginAs, mockServiceRoutes, mockUsers, MockUser, basicInit } from "./test_utils/test_utils";
import { Page } from '@playwright/test';

test("login as diner", async ({ page }) => {
  await basicInit(page);
  await loginAs(page, mockUsers.diner);
});

test("login as franchisee", async ({ page }) => {
  await basicInit(page);
  await loginAs(page, mockUsers.diner);
});

test("franchisee dashboard", async ({ page }) => {
  await basicInit(page);
  await loginAs(page, mockUsers.franchisee);
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('main')).toContainText('Everything you need to run');
});

test("login as admin", async ({ page }) => {
  await basicInit(page);
  await loginAs(page, mockUsers.diner);
});

test("admin dashboard", async ({ page }) => {
  await basicInit(page);
  await loginAs(page, mockUsers.admin);
  await page.getByRole("button", { name: "Admin" }).click();
  await expect(page.getByRole("main")).toContainText("Mama Ricci's kitchen");
});
