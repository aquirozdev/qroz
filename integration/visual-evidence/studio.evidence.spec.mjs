import { mkdir } from "node:fs/promises"
import { test, expect } from "@playwright/test"

test("Qroz Studio produces reviewable evidence from a real application journey", async ({ page }) => {
  await mkdir("evidence", { recursive: true })

  await page.goto("/__qroz/")

  await expect(page.getByText("Qroz Studio")).toBeVisible()
  await expect(page.locator("#title")).toHaveText("taskboard")
  await expect(page.locator("#modules")).toContainText("tasks")
  await expect(page.locator("#modules")).toContainText("/tasks/:id")
  await expect(page.locator("#capabilities")).toContainText("tasks.repository")

  const route = page.locator("#modules .route").filter({ hasText: "/tasks/:id" }).first()
  await route.click()
  await expect(page.locator("#detail-content")).toContainText("GET /tasks/:id")
  await expect(page.locator("#detail-content")).toContainText("tasks.repository")
  await expect(page.locator("#runner-method")).toHaveValue("GET")
  await expect(page.locator("#runner-path")).toHaveValue("/tasks/:id")

  await page.screenshot({
    path: "evidence/studio-taskboard-overview.png",
    fullPage: true
  })

  await page.locator("#runner-method").selectOption("GET")
  await page.locator("#runner-path").fill("/tasks/task-1")
  await page.locator("#runner-send").click()

  await expect(page.locator("#runner-response")).toContainText("GET /tasks/task-1 → 200")
  await expect(page.locator("#runner-response")).toContainText("Ship the first Qroz app")
  await expect(page.locator("#requests")).toContainText("GET /tasks/task-1")
  await expect(page.locator("#traces")).not.toContainText("No spans recorded yet")

  await page.screenshot({
    path: "evidence/studio-taskboard-request.png",
    fullPage: true
  })
})
