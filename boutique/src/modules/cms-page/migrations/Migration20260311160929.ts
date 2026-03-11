import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260311160929 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cms_page" add column if not exists "parent_id" text null, add column if not exists "position" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cms_page" drop column if exists "parent_id", drop column if exists "position";`);
  }

}
