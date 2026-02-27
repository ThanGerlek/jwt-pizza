import { expect } from "playwright-test-coverage";
import { Page } from "playwright/test";
import { MockUser, mockUserFromEmail } from "./test_utils";

export async function mockServiceRoutes(page: Page) {
  let loggedInUser: MockUser | undefined;

  // Authorize login for the given user
  await page.route("*/**/api/auth", async (route: any) => {
    const method = route.request().method();

    if (method === "PUT") {
      // Login existing user
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
      await route.fulfill({ json: loginRes });
      return;
    }

    if (method === "POST") {
      // Register a new user
      const registerReq = route.request().postDataJSON();
      const name: string = registerReq.name ?? "JWT Pizza Diner";
      const email: string = registerReq.email ?? "new@jwt.com";
      const password: string = registerReq.password ?? "password";

      const shortenedName =
        name
          .split(" ")
          .filter((p: string) => p.length > 0)
          .map((p: string) => p[0]?.toUpperCase() ?? "")
          .join("") || "JD";

      const newUser: MockUser = {
        id: "99",
        name,
        shortenedName,
        email,
        password,
        roles: [{ role: "diner" }],
      };

      loggedInUser = newUser;

      const registerRes = {
        user: newUser,
        token: "tttttt",
      };

      await route.fulfill({ json: registerRes });
      return;
    }

    if (method === "DELETE") {
      // Logout current user
      loggedInUser = undefined;
      await route.fulfill({ json: { message: "logout successful" } });
      return;
    }

    // Method not supported on this endpoint in the test mock
    await route.fulfill({
      status: 405,
      json: { message: "Method Not Allowed" },
    });
  });

  // Return the currently logged in user
  await page.route("*/**/api/user/me", async (route: any) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: loggedInUser });
  });

  // Update user details
  await page.route(/\/api\/user\/\d+$/, async (route: any) => {
    const method = route.request().method();
    expect(method).toBe("PUT");

    const updateReq = route.request().postDataJSON();
    const updatedUser = {
      ...(loggedInUser ?? {}),
      ...updateReq,
    };

    loggedInUser = updatedUser;

    await route.fulfill({
      json: {
        user: updatedUser,
        token: "tttttt",
      },
    });
  });

  // Delete a store
  await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route: any) => {
    const method = route.request().method();
    expect(method).toBe("DELETE");
    await route.fulfill({ json: { message: "store deleted" } });
  });

  // Create a new store for a franchise
  await page.route(/\/api\/franchise\/\d+\/store$/, async (route: any) => {
    const method = route.request().method();
    expect(method).toBe("POST");

    const storeReq = route.request().postDataJSON();
    const createdStore = {
      id: 10,
      name: storeReq.name ?? "New Store",
      totalRevenue: 0,
    };

    await route.fulfill({ json: createdStore });
  });

  // User-specific franchise lookup
  await page.route(/\/api\/franchise\/\d+$/, async (route: any) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        json: [
          {
            id: 1,
            name: "TestFranchise",
            stores: [{ id: 1, name: "TestStore", totalRevenue: 0 }],
          },
        ],
      });
      return;
    }

    if (method === "DELETE") {
      await route.fulfill({ json: { message: "franchise deleted" } });
      return;
    }

    await route.fulfill({
      status: 405,
      json: { message: "Method Not Allowed" },
    });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route: any) => {
    const method = route.request().method();

    if (method === "GET") {
      const franchiseRes = {
        franchises: [
          {
            id: 2,
            name: "LotaPizza",
            admins: [{ id: 4, name: "pizza franchisee", email: "f@jwt.com" }],
            stores: [
              { id: 4, name: "Lehi", totalRevenue: 0 },
              { id: 5, name: "Springville", totalRevenue: 0 },
              { id: 6, name: "American Fork", totalRevenue: 0 },
            ],
          },
          {
            id: 3,
            name: "PizzaCorp",
            admins: [],
            stores: [{ id: 7, name: "Spanish Fork", totalRevenue: 0 }],
          },
          { id: 4, name: "topSpot", admins: [], stores: [] },
        ],
        more: true,
      };
      await route.fulfill({ json: franchiseRes });
      return;
    }

    if (method === "POST") {
      const franchiseReq = route.request().postDataJSON();
      const createdFranchise = {
        id: 5,
        name: franchiseReq.name,
        admins: (franchiseReq.admins ?? []).map((a: any, idx: number) => ({
          ...a,
          id: idx + 4,
          name: a.name ?? "pizza franchisee",
        })),
        stores: [],
      };
      await route.fulfill({ json: createdFranchise });
      return;
    }

    await route.fulfill({
      status: 405,
      json: { message: "Method Not Allowed" },
    });
  });

  // A standard menu
  await page.route("*/**/api/order/menu", async (route: any) => {
    const method = route.request().method();

    if (method === "GET") {
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
      await route.fulfill({ json: menuRes });
      return;
    }

    if (method === "PUT") {
      const newItem = route.request().postDataJSON();
      const createdItem = {
        id: 3,
        ...newItem,
      };
      await route.fulfill({ json: [createdItem] });
      return;
    }

    await route.fulfill({
      status: 405,
      json: { message: "Method Not Allowed" },
    });
  });

  // Order a pizza.
  await page.route("*/**/api/order", async (route: any) => {
    const method = route.request().method();

    if (method === "POST") {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: {
          ...orderReq,
          id: 23,
        },
        jwt: "eyJpYXQ",
      };
      await route.fulfill({ json: orderRes });
      return;
    }

    if (method === "GET") {
      const historyRes = {
        dinerId: loggedInUser?.id ?? 4,
        orders: [
          {
            id: 1,
            franchiseId: 1,
            storeId: 1,
            date: new Date().toISOString(),
            items: [
              {
                id: 1,
                menuId: 1,
                description: "Veggie",
                price: 0.05,
              },
            ],
          },
        ],
        page: 1,
      };
      await route.fulfill({ json: historyRes });
      return;
    }

    await route.fulfill({
      status: 405,
      json: { message: "Method Not Allowed" },
    });
  });
}
