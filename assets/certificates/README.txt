Certificates are published automatically once the file here is a real PDF.

The current files are 52-byte text placeholders, so the site hides them
(it checks that each file starts with "%PDF-", both in tools/render.mjs and in the browser).

To publish one: replace the placeholder with the real PDF, keeping the same filename:
- aws-developer.pdf
- data-engineering.pdf
- rest-apis.pdf
- python-rice.pdf
- python-michigan.pdf
- strategic-management.pdf
- google-data.pdf
- marketing-mix.pdf
- management-international.pdf

Then run `node tools/render.mjs` so it is also in the no-JavaScript HTML.
To add a new certificate, add an entry to `certificates` in js/content.js.
