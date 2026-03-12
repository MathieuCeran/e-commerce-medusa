module.exports = {
  extends: ["next/core-web-vitals"],
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
  rules: {
    // The following @next/next rules crash in App Router-only projects (no pages/ dir).
    // They require legacy Pages Router context (_document, _app, pages/) to load properly.
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-page-custom-font": "off",
    "@next/next/no-typos": "off",
    "@next/next/no-duplicate-head": "off",
    "@next/next/no-before-interactive-script-outside-document": "off",
    "@next/next/no-styled-jsx-in-document": "off",
    "@next/next/no-document-import-in-page": "off",
    "@next/next/no-head-import-in-document": "off",
    "@next/next/no-title-in-document-head": "off",
    "@next/next/no-script-component-in-head": "off",
    "@next/next/no-head-element": "off",
  },
};
