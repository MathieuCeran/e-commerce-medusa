import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260128125931 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "theme_settings" ("id" text not null, "store_id" text null, "logo_url" text null, "favicon_url" text null, "store_name" text not null default 'My Store', "primary_color" text not null default '#000000', "secondary_color" text not null default '#ffffff', "accent_color" text not null default '#3b82f6', "background_color" text not null default '#ffffff', "text_color" text not null default '#111827', "text_muted_color" text not null default '#6b7280', "heading_font" text not null default 'Inter', "body_font" text not null default 'Inter', "header_bg_color" text not null default '#ffffff', "header_text_color" text not null default '#111827', "footer_bg_color" text not null default '#111827', "footer_text_color" text not null default '#ffffff', "button_bg_color" text not null default '#000000', "button_text_color" text not null default '#ffffff', "button_border_radius" text not null default '4px', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "theme_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_theme_settings_deleted_at" ON "theme_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "theme_settings" cascade;`);
  }

}
