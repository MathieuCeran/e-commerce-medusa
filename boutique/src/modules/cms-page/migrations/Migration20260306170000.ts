import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260306170000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_layout_type_unique" ON "cms_layout" ("type") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_layout_type_unique";`)
  }
}
