import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260129120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "cms_page" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false;`)

    // Set the homepage (slug = 'home' or slug = '/') as system page
    this.addSql(`UPDATE "cms_page" SET "is_system" = true, "slug" = '/' WHERE "slug" = 'home';`)
  }

  override async down(): Promise<void> {
    this.addSql(`UPDATE "cms_page" SET "slug" = 'home' WHERE "slug" = '/' AND "is_system" = true;`)
    this.addSql(`ALTER TABLE "cms_page" DROP COLUMN IF EXISTS "is_system";`)
  }
}
