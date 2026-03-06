import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260306120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings"
      add column if not exists "instagram_url" text null,
      add column if not exists "facebook_url" text null,
      add column if not exists "linkedin_url" text null,
      add column if not exists "tiktok_url" text null,
      add column if not exists "pinterest_url" text null,
      add column if not exists "google_business_url" text null,
      add column if not exists "show_out_of_stock" boolean not null default false,
      add column if not exists "enable_back_in_stock_alerts" boolean not null default false,
      add column if not exists "show_product_recommendations" boolean not null default true,
      add column if not exists "show_new_tag" boolean not null default true,
      add column if not exists "show_low_stock" boolean not null default false,
      add column if not exists "low_stock_threshold" integer not null default 5,
      add column if not exists "offer_gift_wrapping" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings"
      drop column if exists "instagram_url",
      drop column if exists "facebook_url",
      drop column if exists "linkedin_url",
      drop column if exists "tiktok_url",
      drop column if exists "pinterest_url",
      drop column if exists "google_business_url",
      drop column if exists "show_out_of_stock",
      drop column if exists "enable_back_in_stock_alerts",
      drop column if exists "show_product_recommendations",
      drop column if exists "show_new_tag",
      drop column if exists "show_low_stock",
      drop column if exists "low_stock_threshold",
      drop column if exists "offer_gift_wrapping";`);
  }

}
