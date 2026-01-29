import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260128151726 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings" add column if not exists "header_variant" text not null default 'one', add column if not exists "footer_variant" text not null default 'one';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings" drop column if exists "header_variant", drop column if exists "footer_variant";`);
  }

}
