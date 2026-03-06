import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260306130000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cms_page" add column if not exists "noindex" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cms_page" drop column if exists "noindex";`);
  }

}
