import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

async function createStudentViaApi(world: CustomWorld) {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const form = new URLSearchParams();
  form.set('name', `Student ${unique}`);
  form.set('email', `student${unique}@example.com`);
  form.set('department', 'Computer Science');
  form.set('phone', '+1234567890');

  const resp = await world.api.post('/students', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: form.toString()
  });

  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.id).toBeTruthy();
  world.createdStudentIds.push(body.id);
  return body;
}

Given('the Student Management app is running', async function (this: CustomWorld) {
  const resp = await this.api.get('/');
  expect(resp.status()).toBe(200);
});

Given('there is at least 1 student in the system', async function (this: CustomWorld) {
  const created = await createStudentViaApi(this);
  if (!this.deletedStudentId) this.deletedStudentId = created.id;
});

When('I open the homepage', async function (this: CustomWorld) {
  await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  this.homeNavigationTimeOrigin = await this.page.evaluate(() => performance.timeOrigin);
  await expect(this.page.getByRole('heading', { name: 'Student Management' })).toBeVisible();

  const table = this.page.locator('#student-table');
  const empty = this.page.locator('#student-list-empty');
  await Promise.race([
    table.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    empty.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  ]);
});

Then('I should see the {string} section', async function (this: CustomWorld, title: string) {
  await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
});

Then('I should see at least 1 student row in the list', async function (this: CustomWorld) {
  const rows = this.page.locator('#student-table-body tr');
  await expect(rows.first()).toBeVisible();
});

Then('each student row should display id, name, email and department', async function (this: CustomWorld) {
  const rows = this.page.locator('#student-table-body tr');
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const cells = rows.nth(rowIndex).locator('td');
    await expect(cells).toHaveCount(7);
    for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
      await expect(cells.nth(columnIndex)).not.toHaveText('');
    }
  }
});

Then('each student row should display phone and status columns', async function (this: CustomWorld) {
  const headerCells = this.page.locator('#student-table thead th');
  await expect(headerCells).toContainText(['Phone', 'Status']);
});

When('I delete the first student from the list', async function (this: CustomWorld) {
  const firstRow = this.page.locator('#student-table-body tr').first();
  const idText = (await firstRow.locator('td').first().innerText()).trim();
  this.deletedStudentId = idText;

  const deleteBtn = firstRow.getByRole('button', { name: /delete/i });
  await expect(deleteBtn).toBeVisible();

  this.page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await deleteBtn.click();

  const rows = this.page.locator('#student-table-body tr');
  await expect(rows.locator(`td:text-is("${idText}")`)).toHaveCount(0);
  this.rowCountAfterDelete = await rows.count();
});

Then('the student should be removed from the list without a full page reload', async function (this: CustomWorld) {
  expect(this.homeNavigationTimeOrigin).toBeDefined();
  expect(await this.page.evaluate(() => performance.timeOrigin)).toBe(this.homeNavigationTimeOrigin);
  await expect(this.page.getByRole('heading', { name: 'Student Management' })).toBeVisible();
});

Then('I should see a success message', async function (this: CustomWorld) {
  const msg = this.page.locator('#message');
  await expect(msg).toBeVisible();
  await expect(msg).toHaveClass(/success|message-success|message--success/);
});

When('I attempt to delete the same student again via API', async function (this: CustomWorld) {
  expect(this.deletedStudentId).toBeTruthy();
  const resp = await this.api.delete(`/students/${this.deletedStudentId}`);
  this.duplicateDeleteStatus = resp.status();
  this.duplicateDeleteResponse = await resp.json();
});

Then('the API should respond with a not-found error', async function (this: CustomWorld) {
  expect(this.duplicateDeleteStatus).toBe(404);
  expect(this.duplicateDeleteResponse?.code).toBe('NOT_FOUND');
  expect(this.duplicateDeleteResponse?.message).toMatch(/not found/i);
});

Then('the student list should remain unchanged', async function (this: CustomWorld) {
  expect(this.rowCountAfterDelete).toBeDefined();
  await expect(this.page.locator('#student-table-body tr')).toHaveCount(this.rowCountAfterDelete!);
  expect(this.deletedStudentId).toBeTruthy();
  await expect(this.page.locator(`#student-table-body tr td:text-is("${this.deletedStudentId}")`)).toHaveCount(0);
});

When('I create a new student via the UI form', async function (this: CustomWorld) {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const name = `UI Student ${unique}`;
  const email = `ui.student${unique}@example.com`;

  await this.page.fill('#studentName', name);
  await this.page.fill('#studentEmail', email);
  await this.page.selectOption('#studentDepartment', { label: 'Computer Science' });
  await this.page.fill('#studentPhone', '+12345678901');

  this.page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await this.page.getByRole('button', { name: /add student/i }).click();

  const msg = this.page.locator('#message');
  await expect(msg).toBeVisible();
  await expect(msg).toHaveClass(/success|message-success|message--success/);

  (this as any).lastCreatedStudentName = name;
});

Then('I should see the new student in the list', async function (this: CustomWorld) {
  const name = (this as any).lastCreatedStudentName;
  expect(name).toBeTruthy();
  const rowByName = this.page.locator('#student-table-body tr', { hasText: name });
  await expect(rowByName).toHaveCount(1);
});
