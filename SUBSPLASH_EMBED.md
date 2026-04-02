# One Year Bible — Embed on The River’s website (Subsplash)

**Live app:** https://therivercc-oyb.netlify.app/

This page shows the church’s **One Year Bible** reading plan (NIV). You can drop it into a Subsplash **Custom HTML** block (or any page that allows embed code).

---

## Quick embed (copy & paste)

Use this **iframe** code and replace nothing if the URL stays the same:

```html
<iframe
  src="https://therivercc-oyb.netlify.app/"
  title="One Year Bible"
  style="width:100%;min-height:800px;border:0;"
  loading="lazy"
></iframe>
```

- **`min-height:800px`** — gives enough room to scroll the readings. If it feels short on phones, try `900px` or `1000px`.
- **`border:0`** — removes the default iframe outline so it blends with your page.

---

## In Subsplash (typical steps)

Exact menus can change, but usually:

1. Open the **Subsplash Web** editor for the page where you want this (e.g. a custom page or “One Year Bible” page).
2. Add a block that allows **HTML** or **embed** (often **Custom HTML**, **Embed**, or **Code**).
3. Paste the iframe code above.
4. **Save** and **preview** on desktop and phone.

If the block asks for “URL only,” use:

`https://therivercc-oyb.netlify.app/`

…but a full **iframe** usually works better for layout and height.

---

## Optional: open a specific day

Append a date so the link opens that day’s readings (handy for email or announcements):

`https://therivercc-oyb.netlify.app/?date=2026-04-15`

(Use `YYYY-MM-DD` for the date.)

---

## Who to contact if something breaks

- **Netlify / hosting:** whoever manages this Netlify site.  
- **API / scripture not loading:** the site needs a valid API key in Netlify (technical setup).  
- **Subsplash editor:** Subsplash support or your web admin.

---

*This file is for church staff. The app itself is hosted at Netlify and is safe to link and embed publicly.*
