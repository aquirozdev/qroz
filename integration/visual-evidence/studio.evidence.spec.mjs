import { mkdir } from "node:fs/promises"
import { test, expect } from "@playwright/test"

test("Arc Studio produces reviewable evidence from a real application journey", async ({ page }) => {
  await mkdir("evidence", { recursive: true })

  await page.goto("/__arc/")

  await expect(page.getByText("Arc Studio")).toBeVisible()
  await expect(page.locator("#title")).toHaveText("taskboard")
  await expect(page.locator("#modules")).toContainText("tasks")
  await expect(page.locator("#modules")).toContainText("/tasks/:id")
  await expect(page.locator("#capabilities")).toContainText("tasks.repository")

  await page.screenshot({
    path: "evidence/studio-taskboard-overview.png",
    fullPage: true
  })

  await page.locator("#runner-method").selectOption("GET")
  await page.locator("#runner-path").fill("/tasks/task-1")
  await page.locator("#runner-send").click()

  await expect(page.locator("#runner-response")).toContainText("GET /tasks/task-1 → 200")
  await expect(page.locator("#runner-response")).toContainText("Ship the first Arc app")
  await expect(page.locator("#requests")).toContainText("GET /tasks/task-1")
  await expect(page.locator("#traces")).not.toContainText("No spans recorded yet")

  await page.screenshot({
    path: "evidence/studio-taskboard-request.png",
    fullPage: true
  })
})
