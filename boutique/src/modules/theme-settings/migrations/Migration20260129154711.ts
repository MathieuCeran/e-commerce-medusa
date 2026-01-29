import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260129154711 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings" add column if not exists "product_template_variant" text not null default 'classique';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings" drop column if exists "product_template_variant";`);
  }

}
