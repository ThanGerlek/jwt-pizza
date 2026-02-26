import { expect, test } from "playwright-test-coverage";
import { basicInit, loginAsDiner, mockUsers } from "./test_utils/test_utils";
import { Page } from "@playwright/test";

async function createOrderAndCheckout(page: Page) {
  // Go to order page
  await page.getByRole("button", { name: "Order now" }).click();

  // Create order
  await expect(page.locator("h2")).toContainText("Awesome is a click away");
  await page.getByRole("combobox").selectOption("4");
  await page.getByRole("link", { name: "Image Description Veggie A" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await expect(page.locator("form")).toContainText("Selected pizzas: 2");
  await page.getByRole("button", { name: "Checkout" }).click();
}

async function pay(page: Page) {
  // Pay
  await expect(page.getByRole("main")).toContainText(
    "Send me those 2 pizzas right now!",
  );
  await expect(page.locator("tbody")).toContainText("Veggie");
  await expect(page.locator("tbody")).toContainText("Pepperoni");
  await expect(page.locator("tfoot")).toContainText("0.008 ₿");
  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page.getByRole("heading")).toContainText(
    "Here is your JWT Pizza!",
  );

  // Expect further links
  await expect(page.getByRole("button", { name: "Verify" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Order more" })).toBeVisible();

  // Check balance
  await expect(page.getByText("0.008")).toBeVisible();
}

test("purchase before login", async ({ page }) => {
  await basicInit(page);

  await createOrderAndCheckout(page);

  await page
    .getByRole("textbox", { name: "Email address" })
    .fill(mockUsers.diner.email);
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(mockUsers.diner.password);
  await page.getByRole("button", { name: "Login" }).click();

  await pay(page);
});

test("purchase after login", async ({ page }) => {
  await basicInit(page);

  await loginAsDiner(page);
  await createOrderAndCheckout(page);

  await pay(page);
});

test("cancel purchase", async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);

  await createOrderAndCheckout(page);

  await page.getByRole("button", { name: "Cancel" }).click();
});
