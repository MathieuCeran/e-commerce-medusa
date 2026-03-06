import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260306190000 extends Migration {
  override async up(): Promise<void> {
    // Drop old indexes on "type"
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_layout_type_unique";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_layout_type";`)

    // Drop CHECK constraint that limits type to header/footer
    this.addSql(`ALTER TABLE "cms_layout" DROP CONSTRAINT IF EXISTS "cms_layout_type_check";`)

    // Rename type → name
    this.addSql(`ALTER TABLE "cms_layout" RENAME COLUMN "type" TO "name";`)

    // Migrate existing component_data: single object → array of objects
    this.addSql(`UPDATE "cms_layout" SET component_data = jsonb_build_array(component_data) WHERE jsonb_typeof(component_data) = 'object' AND component_data != '{}';`)
    this.addSql(`UPDATE "cms_layout" SET component_data = '[]' WHERE component_data = '{}' OR component_data IS NULL;`)

    // New indexes on "name"
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_layout_name" ON "cms_layout" ("name") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_layout_name_unique" ON "cms_layout" ("name") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_layout_name_unique";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_layout_name";`)
    this.addSql(`ALTER TABLE "cms_layout" RENAME COLUMN "name" TO "type";`)
    this.addSql(`UPDATE "cms_layout" SET component_data = component_data->0 WHERE jsonb_typeof(component_data) = 'array' AND jsonb_array_length(component_data) = 1;`)
    this.addSql(`ALTER TABLE "cms_layout" ADD CONSTRAINT "cms_layout_type_check" CHECK ("type" IN ('header', 'footer'));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_layout_type_unique" ON "cms_layout" ("type") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_layout_type" ON "cms_layout" ("type") WHERE deleted_at IS NULL;`)
  }
}
