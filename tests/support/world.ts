import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, APIRequestContext, request } from '@playwright/test';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  api!: APIRequestContext;
  baseURL!: string;
  createdStudentIds: string[] = [];
  deletedStudentId?: string;
  homeNavigationTimeOrigin?: number;
  rowCountAfterDelete?: number;
  duplicateDeleteStatus?: number;
  duplicateDeleteResponse?: { code?: string; message?: string };

  constructor(options: IWorldOptions) {
    super(options);
    this.baseURL = process.env.BASE_URL || 'http://localhost:8000';
  }

  async init() {
    this.browser = await chromium.launch();
    this.context = await this.browser.newContext({ baseURL: this.baseURL });
    this.page = await this.context.newPage();
    this.api = await request.newContext({ baseURL: this.baseURL });
  }

  async dispose() {
    try {
      if (this.api) await this.api.dispose();
    } catch {}
    try {
      if (this.context) await this.context.close();
    } catch {}
    try {
      if (this.browser) await this.browser.close();
    } catch {}
  }
}

setWorldConstructor(CustomWorld);
