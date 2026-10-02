import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { enMessages as messages } from "../../src/app/components/ui-next/localization/locales/en";

const fixture = JSON.parse(readFileSync("tests/e2e/.auth/pc2.json", "utf8")) as {
  sharedProjectId: string;
};
const project = `/app/projects/${fixture.sharedProjectId}`;
const api = `/api/app/projects/${fixture.sharedProjectId}`;
const unique = (label: string) => `${label} ${randomUUID()}`;

async function storedTask(request: APIRequestContext, id: string) {
  const response = await request.get(`${api}/tasks`);
  expect(response.status()).toBe(200);
  const { tasks } = await response.json();
  const task = tasks.find((item: { id: string }) => item.id === id);
  expect(task).toBeDefined();
  return task;
}

async function createTask(request: APIRequestContext, extra = {}) {
  const response = await request.post(`${api}/tasks`, {
    data: { title: unique("Research task"), ...extra },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).task;
}

async function openTask(page: Page, id: string) {
  await page.goto(`${project}/tasks?task=${id}`);
  await expect(page.getByRole("dialog")).toBeVisible();
  return page.getByRole("dialog");
}

test.beforeEach(async ({ page }) => {
  expect((await page.request.patch("/api/app/locale", { data: { locale: "en" } })).ok()).toBe(true);
});
test.afterEach(async ({ page }) => {
  await page.request.patch("/api/app/locale", { data: { locale: "vi" } });
});

test("collapsed planning fields persist and a created task appears exactly once", async ({
  page,
}) => {
  await page.goto(`${project}/tasks`);
  await page.getByRole("button", { name: messages["tasks.new"], exact: true }).click();
  const dialog = page.getByRole("dialog");
  const title = unique("Planned fieldwork");
  await dialog.getByLabel(messages["tasks.field.title"], { exact: true }).fill(title);
  const planning = dialog.locator("details").filter({ hasText: messages["panel.taskPlanning"] });
  await planning.locator("summary").click();
  await dialog
    .getByLabel(messages["tasks.field.sprint"], { exact: true })
    .fill("Fieldwork round 2");
  await dialog.getByLabel(messages["tasks.field.kind"], { exact: true }).selectOption("feature");
  await dialog.getByLabel(messages["tasks.field.estimatePoints"], { exact: true }).fill("5");
  await planning.locator("summary").click();
  const created = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().endsWith("/tasks"),
  );
  await dialog.getByRole("button", { name: messages["tasks.create.submit"], exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const { task } = await response.json();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button").filter({ hasText: title })).toHaveCount(1);
  expect(await storedTask(page.request, task.id)).toMatchObject({
    title,
    projectId: fixture.sharedProjectId,
    sprint: "Fieldwork round 2",
    kind: "feature",
    estimatePoints: 5,
  });
  const reopened = await openTask(page, task.id);
  await expect(reopened.getByLabel(messages["tasks.field.sprint"], { exact: true })).toHaveValue(
    "Fieldwork round 2",
  );
  await expect(
    reopened.getByLabel(messages["tasks.field.estimatePoints"], { exact: true }),
  ).toHaveValue("5");
});

test("a concurrent task update rejects stale saves without discarding the user's text", async ({
  page,
}) => {
  const task = await createTask(page.request);
  const dialog = await openTask(page, task.id);
  const localTitle = unique("Unsaved local interpretation");
  await dialog.getByLabel(messages["tasks.field.title"], { exact: true }).fill(localTitle);
  const remoteTitle = unique("Collaborator interpretation");
  const remote = await page.request.patch(`${api}/tasks/${task.id}`, {
    data: { title: remoteTitle, expectedVersion: task.version },
  });
  expect(remote.status()).toBe(200);
  const saved = page.waitForResponse(
    (r) => r.request().method() === "PATCH" && r.url().endsWith(`/tasks/${task.id}`),
  );
  await dialog.getByRole("button", { name: messages["common.save"], exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(409);
  expect(response.request().postDataJSON().expectedVersion).toBe(task.version);
  await expect(dialog.getByLabel(messages["tasks.field.title"], { exact: true })).toHaveValue(
    localTitle,
  );
  expect(await storedTask(page.request, task.id)).toMatchObject({
    title: remoteTitle,
    version: task.version + 1,
  });
});

test("contributors can inspect another user's task but cannot modify it through the panel or API", async ({
  page,
  browser,
}) => {
  const task = await createTask(page.request);
  const context = await browser.newContext({ storageState: "tests/e2e/.auth/collaborator.json" });
  try {
    const reader = await context.newPage();
    await reader.request.patch("/api/app/locale", { data: { locale: "en" } });
    const dialog = await openTask(reader, task.id);
    await expect(dialog.getByLabel(messages["tasks.field.title"], { exact: true })).toHaveValue(
      task.title,
    );
    await expect(dialog.getByLabel(messages["tasks.field.title"], { exact: true })).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: messages["common.save"], exact: true }),
    ).toHaveCount(0);
    const denied = await reader.request.patch(`${api}/tasks/${task.id}`, {
      data: { title: "Unauthorized overwrite", expectedVersion: task.version },
    });
    expect(denied.status()).toBe(403);
    expect(await storedTask(page.request, task.id)).toMatchObject({
      title: task.title,
      version: task.version,
    });
  } finally {
    await context.request.patch("/api/app/locale", { data: { locale: "vi" } });
    await context.close();
  }
});

test("Calendar retries failed task loading and saves with the actual project and version", async ({
  page,
}) => {
  const dueAt = new Date(Date.now() + 86_400_000).toISOString();
  const task = await createTask(page.request, {
    dueAt,
    notes: "Keep the original fieldwork context",
  });
  await page.goto(`/app/calendar?m=${dueAt.slice(0, 7)}`);
  const entry = page.locator("main button").filter({ hasText: task.title });
  if (!(await entry.isVisible()))
    await entry.locator("xpath=ancestor::details").locator("summary").click();
  await page.route(
    `**${api}/tasks`,
    (route) => route.fulfill({ status: 503, json: { error: "unavailable" } }),
    { times: 1 },
  );
  await entry.click();
  await expect(page.getByText(messages["tasks.loadFailed"], { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await storedTask(page.request, task.id)).toMatchObject({ version: task.version });
  await page.getByRole("button", { name: messages["saveStatus.retry"], exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(messages["tasks.field.notes"], { exact: true })).toHaveValue(
    task.notes,
  );
  const title = unique("Updated from Calendar");
  await dialog.getByLabel(messages["tasks.field.title"], { exact: true }).fill(title);
  const saved = page.waitForResponse(
    (r) => r.request().method() === "PATCH" && r.url().endsWith(`/tasks/${task.id}`),
  );
  await dialog.getByRole("button", { name: messages["common.save"], exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  expect(response.url()).toContain(`${api}/tasks/${task.id}`);
  expect(response.request().postDataJSON().expectedVersion).toBe(task.version);
  await page.reload();
  await expect(page.locator("main button").filter({ hasText: title })).toHaveCount(1);
  expect(await storedTask(page.request, task.id)).toMatchObject({
    title,
    notes: task.notes,
    version: task.version + 1,
  });
});

test("a private draft autosaves across reload and becomes readable only after explicit project sharing", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const title = unique("Private synthesis");
  await page.goto(`${project}/notes?create=1`);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(messages["notes.field.title"], { exact: true }).fill(title);
  const created = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().endsWith("/notes"),
  );
  await dialog.getByRole("button", { name: messages["notes.create.submit"], exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(page).toHaveURL(new RegExp(`${project}/notes/[^?]+$`));
  const draftUrl = page.url();
  const content = unique("Evidence-based private findings");
  const autosaved = page.waitForResponse(
    (r) => r.request().method() === "PUT" && r.url().endsWith("/draft"),
  );
  await page
    .getByRole("textbox", { name: messages["notes.field.content"], exact: true })
    .fill(content);
  expect((await autosaved).status()).toBe(200);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: messages["notes.field.content"], exact: true }),
  ).toHaveValue(content);
  const context = await browser.newContext({ storageState: "tests/e2e/.auth/collaborator.json" });
  try {
    const reader = await context.newPage();
    await reader.request.patch("/api/app/locale", { data: { locale: "en" } });
    await reader.goto(draftUrl);
    await expect(
      reader.getByRole("heading", {
        name: messages["workspace.projectUnavailableTitle"],
        level: 2,
        exact: true,
      }),
    ).toBeVisible();
    await expect(reader.locator("main")).not.toContainText(content);
    const draftId = new URL(draftUrl).pathname.split("/").at(-1);
    expect(
      (
        await reader.request.get(`${api}/notes/${draftId}/evidence/search?scope=project&q=`)
      ).status(),
    ).toBe(404);
    await reader.goto(`${project}/notes`);
    await expect(reader.getByRole("link", { name: title, exact: true })).toHaveCount(0);
    const shared = page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().endsWith("/publish"),
    );
    await page.getByRole("button", { name: "Share with project", exact: true }).click();
    const response = await shared;
    expect(response.status()).toBe(200);
    await expect(page).not.toHaveURL(draftUrl);
    const nodeId = new URL(page.url()).pathname.split("/").at(-1)!;
    await reader.goto(`${project}/notes/${nodeId}`);
    await expect(reader.locator(".ui-next-note-reader")).toContainText(content);
    const history = await reader.request.get(`${api}/notes/${nodeId}/history/1`);
    expect(history.status()).toBe(200);
    expect((await history.json()).version).toMatchObject({ contentMd: content });
    const anonymous = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      expect((await anonymous.request.get(`${api}/notes/${nodeId}/history/1`)).status()).toBe(401);
    } finally {
      await anonymous.close();
    }
  } finally {
    await context.request.patch("/api/app/locale", { data: { locale: "vi" } });
    await context.close();
  }
});

for (const width of [390, 1440]) {
  test(`research pages have aligned frames and usable panel actions at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/app");
    const projects = page.locator('section[aria-labelledby="overview-projects-title"]');
    const work = page.locator('section[aria-labelledby="overview-work-title"]');
    expect(await projects.locator('section[aria-labelledby="overview-work-title"]').count()).toBe(
      0,
    );
    const left = (await projects.boundingBox())!;
    const right = (await work.boundingBox())!;
    if (width > 1024) expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(1);
    else {
      expect(Math.abs(left.x - right.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(left.width - right.width)).toBeLessThanOrEqual(1);
      expect(right.y).toBeGreaterThanOrEqual(left.y + left.height);
    }
    await page.screenshot({ path: testInfo.outputPath("overview.png"), fullPage: true });
    await page.goto(project);
    const panels = page.locator(".ui-next-research-panel");
    const padding = await panels.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).paddingLeft),
    );
    expect(new Set(padding).size).toBe(1);
    for (const selector of [
      ".ui-next-project-header",
      ".ui-next-project-navigation",
      ".ui-next-research-path",
      ".ui-next-research-home__columns",
      ".ui-next-research-planning",
    ]) {
      const frame = (await page.locator(selector).boundingBox())!;
      const reference = (await page.locator(".ui-next-project-header").boundingBox())!;
      expect(Math.abs(frame.x - reference.x), selector).toBeLessThanOrEqual(1);
      expect(Math.abs(frame.width - reference.width), selector).toBeLessThanOrEqual(1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath("research-home.png"), fullPage: true });
    await page.goto(`${project}/tasks`);
    const summary = page.locator(".ui-next-task-summary").first();
    const titleBox = (await summary.locator("strong").boundingBox())!;
    const metadataBox = (await summary.locator(".ui-next-task-summary__meta").boundingBox())!;
    expect(metadataBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height);
    await page.getByRole("button", { name: messages["tasks.new"], exact: true }).click();
    const dialog = page.getByRole("dialog");
    const title = unique("Panel scroll check");
    await dialog.getByLabel(messages["tasks.field.title"], { exact: true }).fill(title);
    await dialog.locator("summary").filter({ hasText: messages["panel.taskPlanning"] }).click();
    await dialog
      .getByLabel(messages["tasks.field.notes"], { exact: true })
      .fill("Long fieldwork notes\n".repeat(20));
    const save = dialog.getByRole("button", { name: messages["tasks.create.submit"], exact: true });
    await expect(save).toBeInViewport();
    await dialog.locator(".ui-next-dialog__body").evaluate((body) => {
      body.scrollTop = body.scrollHeight;
    });
    await expect(save).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath("task-panel.png"), fullPage: true });
    const created = page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().endsWith("/tasks"),
    );
    await save.click();
    const response = await created;
    expect(response.status()).toBe(201);
    expect(await storedTask(page.request, (await response.json()).task.id)).toMatchObject({
      title,
    });
  });
}

test("evidence selection binds the chosen source version and survives newer uploads and sharing", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const title = unique("Versioned interview source");
  const original = Buffer.from("Original interview transcript, before corrections.");
  const materialResponse = await page.request.post(`${api}/materials`, {
    multipart: {
      title,
      file: { name: "interview-v1.txt", mimeType: "text/plain", buffer: original },
    },
  });
  expect(materialResponse.status()).toBe(201);
  const { material } = await materialResponse.json();
  const versionId = material.currentVersion.id;
  const upload = () =>
    page.request.post(`${api}/materials/${material.id}/versions`, {
      multipart: {
        file: {
          name: "interview-corrected.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Corrected transcript."),
        },
      },
    });
  expect((await upload()).status()).toBe(201);
  const created = await page.request.post(`${api}/notes`, {
    data: {
      title: unique("Interview synthesis"),
      contentMd: "Findings refer to the original interview.",
    },
  });
  expect(created.status()).toBe(201);
  const { draft } = await created.json();
  await page.goto(`${project}/notes/${draft.id}`);
  await page.getByRole("button", { name: messages["journey.evidence"], exact: true }).click();
  const picker = page.getByRole("dialog", { name: messages["notes.evidence.add"], exact: true });
  await picker.getByPlaceholder(messages["notes.evidence.searchPlaceholder"]).fill(title);
  await picker.getByRole("button").filter({ hasText: title }).click();
  await expect(picker.locator('input[name="evidence-version"]')).toHaveCount(2);
  await picker.locator(`input[value="${versionId}"]`).check();
  const attached = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().endsWith("/evidence/source-version"),
  );
  await picker
    .getByRole("button", { name: messages["notes.evidence.attachAction"], exact: true })
    .click();
  const response = await attached;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toMatchObject({ sourceVersionId: versionId });
  const shared = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().endsWith("/publish"),
  );
  await page
    .getByRole("button", { name: messages["notes.action.saveInternal"], exact: true })
    .click();
  const publication = await shared;
  expect(publication.status()).toBe(200);
  await expect(page).not.toHaveURL(new RegExp(`/notes/${draft.id}$`));
  const nodeId = new URL(page.url()).pathname.split("/").at(-1)!;
  expect((await upload()).status()).toBe(201);
  await page.goto(`${project}/notes/${nodeId}`);
  await page.getByRole("button", { name: messages["notes.action.inspector"], exact: true }).click();
  const evidence = page
    .locator(".ui-next-note-inspector__evidence-item")
    .filter({ hasText: title });
  await expect(evidence).toHaveCount(1);
  await expect(evidence).toContainText("v1");
  await expect(evidence).not.toContainText("v3");
  const download = await page.request.get(
    `${api}/materials/${material.id}/versions/${versionId}/download`,
  );
  expect(download.status()).toBe(200);
  expect(await download.body()).toEqual(original);
});
