import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260311145214 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cms_layout" add column if not exists "description" text null, add column if not exists "is_default" boolean not null default false;`);
    this.addSql(`alter table if exists "cms_layout" alter column "component_data" type jsonb using ("component_data"::jsonb);`);
    this.addSql(`alter table if exists "cms_layout" alter column "component_data" set default '[]';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cms_layout" drop column if exists "description", drop column if exists "is_default";`);

    this.addSql(`alter table if exists "cms_layout" alter column "component_data" type jsonb using ("component_data"::jsonb);`);
    this.addSql(`alter table if exists "cms_layout" alter column "component_data" set default '{}';`);
  }

}
