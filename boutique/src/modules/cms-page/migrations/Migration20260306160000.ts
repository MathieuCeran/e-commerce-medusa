import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260306160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "cms_layout" (
        "id" text not null,
        "type" text check ("type" in ('header', 'footer')) not null,
        "html" text not null default '',
        "css" text not null default '',
        "components" jsonb not null default '{}',
        "styles" jsonb not null default '{}',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "cms_layout_pkey" primary key ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_layout_type" ON "cms_layout" ("type") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_layout_deleted_at" ON "cms_layout" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cms_layout" cascade;`)
  }
}
