import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260306140000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings"
      add column if not exists "figma_access_token" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings"
      drop column if exists "figma_access_token";`);
  }

}
