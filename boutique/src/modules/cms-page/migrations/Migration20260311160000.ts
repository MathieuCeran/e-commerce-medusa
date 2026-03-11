import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260311160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "cms_page" ADD COLUMN IF NOT EXISTS "parent_id" text NULL, ADD COLUMN IF NOT EXISTS "position" integer NOT NULL DEFAULT 0;`)
    this.addSql(`CREATE UNIQUE INDEX "cms_page_parent_slug_unique" ON "cms_page" (COALESCE(parent_id, '__root__'), slug);`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "cms_page_parent_slug_unique";`)
    this.addSql(`ALTER TABLE IF EXISTS "cms_page" DROP COLUMN IF EXISTS "parent_id", DROP COLUMN IF EXISTS "position";`)
  }
}
