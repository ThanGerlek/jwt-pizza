import { expect } from "playwright-test-coverage";
import { Role } from "../../src/service/pizzaService";
import { Page } from "playwright/test";
import { mockServiceRoutes } from './mock_service_routes';

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  shortenedName: string;
  roles: Record<any, any>[];
};

export const mockUsers: Record<string, MockUser> = {
  admin: {
    id: "1",
    name: "Admin Jwt",
    shortenedName: "AJ",
    email: "a@jwt.com",
    password: "admin",
    roles: [{ role: Role.Admin }],
  },
  franchisee: {
    id: "3",
    name: "Franchisee Jwt",
    shortenedName: "FJ",
    email: "f@jwt.com",
    password: "franchisee",
    roles: [{ role: Role.Diner }, { role: Role.Franchisee, objectId: 1 }],
  },
  diner: {
    id: "2",
    name: "Diner Jwt",
    shortenedName: "DJ",
    email: "d@jwt.com",
    password: "diner",
    roles: [{ role: Role.Diner }],
  },
};

export const mockUserFromEmail = Object.fromEntries(
  Object.values(mockUsers).map((user) => [user.email, user]),
);

export async function basicInit(page: Page) {
  await mockServiceRoutes(page);
  await page.goto("/");
}

async function loginAs(page: Page, user: MockUser) {
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(
    page.getByRole("link", { name: user.shortenedName }),
  ).toBeVisible();
}

export async function loginAsDiner(page: Page) {
  await loginAs(page, mockUsers.diner);
}

export async function loginAsFranchisee(page: Page) {
  await loginAs(page, mockUsers.franchisee);
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, mockUsers.admin);
}
