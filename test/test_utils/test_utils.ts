import { expect } from "playwright-test-coverage";
import { Role } from "../../src/service/pizzaService";
import { Page } from "playwright/test";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  shortenedName: string;
  roles: Record<'role',Role>[]
};

export const mockUsers: Record<string, MockUser> = {
  admin: {
    id: "1",
    name: "Test Admin",
    shortenedName: "TA",
    email: "test.admin@jwt.com",
    password: "testadmin",
    roles: [{ role: Role.Admin }],
  },
  franchisee: {
    id: "3",
    name: "Test Franchisee",
    shortenedName: "TF",
    email: "test.franchisee@jwt.com",
    password: "testfranchisee",
    roles: [{ role: Role.Franchisee }],
  },
  diner: {
    id: "2",
    name: "Test Diner",
    shortenedName: "TD",
    email: "test.diner@jwt.com",
    password: "testdiner",
    roles: [{ role: Role.Diner }],
  },
};

const mockUserFromEmail = Object.fromEntries(
  Object.values(mockUsers).map(user => [user.email, user])
);

export async function mockServiceRoutes(page: Page) {
  let loggedInUser: MockUser | undefined;

  // Authorize login for the given user
  await page.route("*/**/api/auth", async (route: any) => {
    const loginReq = route.request().postDataJSON();
    const user = mockUserFromEmail[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      return;
    }
    loggedInUser = mockUserFromEmail[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    await route.fulfill({ json: loginRes });
  });

  // Return the currently logged in user
  await page.route("*/**/api/user/me", async (route: any) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route("*/**/api/order/menu", async (route: any) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route: any) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: "LotaPizza",
          stores: [
            { id: 4, name: "Lehi" },
            { id: 5, name: "Springville" },
            { id: 6, name: "American Fork" },
          ],
        },
        { id: 3, name: "PizzaCorp", stores: [{ id: 7, name: "Spanish Fork" }] },
        { id: 4, name: "topSpot", stores: [] },
      ],
    };
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  // Order a pizza.
  await page.route("*/**/api/order", async (route: any) => {
    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23 },
      jwt: "eyJpYXQ",
    };
    expect(route.request().method()).toBe("POST");
    await route.fulfill({ json: orderRes });
  });

  await page.goto("/");
}

export async function basicInit(page: Page) {
  await mockServiceRoutes(page);
}

export async function loginAs(page: Page, user: MockUser) {
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: user.shortenedName })).toBeVisible();
}
