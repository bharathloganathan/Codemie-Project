import { After, Before } from '@cucumber/cucumber';
import './world';
import type { CustomWorld } from './world';

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld, scenario) {
  // Best-effort cleanup of created students
  for (const id of this.createdStudentIds ?? []) {
    try {
      await this.api.delete(`/students/${id}`);
    } catch {}
  }

  // Capture screenshot on failure
  // @cucumber/cucumber v11: scenario.result?.status
  const status = (scenario as any).result?.status;
  if (status && status !== 'PASSED') {
    try {
      await this.page.screenshot({
        path: `test-results/screenshots/${Date.now()}-${scenario.pickle.name.replace(/[^a-z0-9-_]+/gi, '_')}.png`,
        fullPage: true
      });
    } catch {}
  }

  await this.dispose();
});
