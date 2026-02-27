import { expect, test } from "playwright-test-coverage";
import { basicInit } from "./test_utils/test_utils";

test("not found", async ({ page }) => {
  await basicInit(page);
  await page.goto("/bob");
  await expect(page.getByRole("heading")).toContainText("Oops");
});

test("docs", async ({ page }) => {
  await basicInit(page);
  await page.goto("/docs");
  await expect(page.getByRole("main")).toContainText("JWT Pizza API");
});

test("home", async ({ page }) => {
  await basicInit(page);
  await page.goto("/");
  await expect(page.getByRole("main")).toContainText("The web's best pizza");
});

test("about", async ({ page }) => {
  await basicInit(page);
  await page.goto("/");
  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByRole("main")).toContainText("The secret sauce");
});

test("history", async ({ page }) => {
  await basicInit(page);
  await page.goto("/");
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading")).toContainText("Mama Rucci, my my");
});

test("menu", async ({ page }) => {
  await basicInit(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Order" }).click();
  await expect(page.getByRole("main")).toContainText("Awesome is a click away");
});
