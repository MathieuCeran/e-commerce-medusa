import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260128090736 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "cms_page" ("id" text not null, "store_id" text null, "slug" text not null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "title" text not null, "seo_meta_title" text null, "seo_meta_description" text null, "seo_og_image_url" text null, "content" jsonb not null default '{}', "preview_token" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cms_page_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_page_deleted_at" ON "cms_page" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cms_page" cascade;`);
  }

}
