import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260306200000 extends Migration {
  override async up(): Promise<void> {
    // Add content_position to cms_layout (index of the content placeholder)
    this.addSql(
      `ALTER TABLE "cms_layout" ADD COLUMN IF NOT EXISTS "content_position" integer NOT NULL DEFAULT -1;`
    )

    // Add layout_id to cms_page (FK to the assigned template)
    this.addSql(
      `ALTER TABLE "cms_page" ADD COLUMN IF NOT EXISTS "layout_id" text NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cms_page_layout_id" ON "cms_page" ("layout_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_page_layout_id";`)
    this.addSql(`ALTER TABLE "cms_page" DROP COLUMN IF EXISTS "layout_id";`)
    this.addSql(
      `ALTER TABLE "cms_layout" DROP COLUMN IF EXISTS "content_position";`
    )
  }
}
