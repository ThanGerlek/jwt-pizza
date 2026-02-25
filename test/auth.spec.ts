import { expect, test } from "playwright-test-coverage";
import { loginAs, mockServiceRoutes, mockUsers, MockUser } from "./test_utils/test_utils";
import { Page } from '@playwright/test';

async function testLoginAs(page: Page, user: MockUser) {
  await mockServiceRoutes(page);
  await loginAs(page, user);
  
  await expect(page.getByRole("link", { name: user.shortenedName })).toBeVisible();
}

test("login as diner", async ({ page }) => {
  await testLoginAs(page, mockUsers.diner);
});

test("login as franchisee", async ({ page }) => {
  await mockServiceRoutes(page);
  await loginAs(page, mockUsers.diner);
  
  await expect(page.getByRole("link", { name: mockUsers.diner.shortenedName })).toBeVisible();
});

test("login as admin", async ({ page }) => {
  await mockServiceRoutes(page);
  await loginAs(page, mockUsers.diner);
  
  await expect(page.getByRole("link", { name: mockUsers.diner.shortenedName })).toBeVisible();
});
