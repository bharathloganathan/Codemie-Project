import { expect, test } from '@playwright/test';

test('homepage displays the student management form and list section', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Student Management' })).toBeVisible();
  await expect(page.locator('#student-form')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Student List' })).toBeVisible();
});
