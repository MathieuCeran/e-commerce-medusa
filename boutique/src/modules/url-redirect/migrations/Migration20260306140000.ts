import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260306140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "url_redirect" (
      "id" text not null,
      "source_url" text not null,
      "target_type" text check ("target_type" in ('homepage', 'cms_page', 'product_category', 'product')) not null default 'homepage',
      "target_id" text null,
      "target_label" text null,
      "status_code" integer not null default 301,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "url_redirect_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_url_redirect_source_url" ON "url_redirect" ("source_url") WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_url_redirect_deleted_at" ON "url_redirect" ("deleted_at") WHERE "deleted_at" IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "url_redirect";`);
  }
}
