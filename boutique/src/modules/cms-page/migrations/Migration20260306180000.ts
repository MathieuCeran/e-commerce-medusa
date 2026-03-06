import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260306180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "cms_layout" RENAME COLUMN "components" TO "component_data";`)
    this.addSql(`ALTER TABLE IF EXISTS "cms_layout" DROP COLUMN IF EXISTS "styles";`)
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "cms_layout" RENAME COLUMN "component_data" TO "components";`)
    this.addSql(`ALTER TABLE IF EXISTS "cms_layout" ADD COLUMN IF NOT EXISTS "styles" jsonb NOT NULL DEFAULT '{}';`)
  }
}
