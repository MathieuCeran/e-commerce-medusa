import { Migration } from "@mikro-orm/migrations"

export class Migration20260311100000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "cms_layout" ADD COLUMN IF NOT EXISTS "description" text NULL;`
    )
    this.addSql(
      `ALTER TABLE "cms_layout" ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;`
    )
    this.addSql(
      `ALTER TABLE "cms_layout" ALTER COLUMN "component_data" SET DEFAULT '[]';`
    )
    // Fix existing rows that have {} as component_data
    this.addSql(
      `UPDATE "cms_layout" SET "component_data" = '[]' WHERE "component_data"::text = '{}';`
    )
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "cms_layout" DROP COLUMN IF EXISTS "description";`)
    this.addSql(`ALTER TABLE "cms_layout" DROP COLUMN IF EXISTS "is_default";`)
    this.addSql(
      `ALTER TABLE "cms_layout" ALTER COLUMN "component_data" SET DEFAULT '{}';`
    )
  }
}
