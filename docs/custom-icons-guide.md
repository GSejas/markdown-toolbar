# Custom Icon Generation Guide

This guide provides step-by-step instructions for creating custom icons in WOFF format for use in web applications and VS Code extensions.

## Overview

WOFF (Web Open Font Format) is an efficient way to deliver custom icons as font glyphs. This approach offers several advantages:

- Small file sizes with compression
- Scalable vector icons that look crisp at any size
- Easy CSS styling (color, size, effects)
- Good browser support
- Single HTTP request for multiple icons

## Prerequisites

- Vector icon in SVG format
- Basic knowledge of CSS and font formats
- Access to font generation tools

## Step 1: Prepare Your SVG Icon

1. **Create or obtain a clean SVG file**
   - Design your icon using tools like Figma, Adobe Illustrator, or Inkscape
   - Ensure the SVG uses simple paths without complex gradients
   - Remove unnecessary metadata, hidden layers, and groupings
   - Use a consistent artboard size (24px or 32px recommended)

2. **Optimize the SVG**
   - Remove `width` and `height` attributes (keep `viewBox`)
   - Simplify paths and combine shapes where possible
   - Ensure the icon works in monochrome (single color)

## Step 2: Choose Your Tools

### GUI Tools (Recommended for Beginners)

**IcoMoon App** (Web-based, Free)

- Visit [icomoon.io/app](https://icomoon.io/app)
- User-friendly interface
- Generates complete font packages with CSS

**FontForge** (Desktop, Free)

- Download from [fontforge.org](https://fontforge.org)
- Advanced features for font editing
- Cross-platform support

**Glyphs/Glyphs Mini** (macOS, Commercial)

- Professional font design tool
- Excellent for complex icon fonts
- Best-in-class glyph editing

### CLI Tools (For Automation)

**fonttools** (Python)

```bash
pip install fonttools
```

**svgtofont** (Node.js)

```bash
npm install -g svgtofont
```

## Step 3: Create the Icon Font

### Using IcoMoon App (Recommended)

1. **Import your SVG**
   - Click "Import Icons" button
   - Select your SVG file(s)
   - Icons will appear in the selection area

2. **Select and configure icons**
   - Click on each icon to select it
   - Icons will show a selection border when active

3. **Assign Unicode codepoints**
   - Click "Generate Font" at the bottom
   - Icons are automatically assigned codepoints in the Private Use Area (U+E001, U+E002, etc.)
   - You can customize these if needed

4. **Name your font**
   - Set a font name (e.g., "MyCustomIcons")
   - Optionally set glyph names for ligature support

### Using CLI Tools

**With svgtofont:**

```bash
# Create icon font from SVG directory
svgtofont --sources ./svg-icons --output ./fonts --fontName MyIcons
```

**With fonttools (for conversion):**

```bash
# Convert existing TTF to WOFF
ttx -o myicons.woff myicons.ttf
```

## Step 4: Generate WOFF Files

1. **Download the font package**
   - IcoMoon provides WOFF, WOFF2, TTF, and EOT formats
   - Download the complete package including CSS

2. **Verify file contents**
   Your package should include:
   - `fonts/` directory with WOFF/WOFF2 files
   - `style.css` with @font-face declarations
   - `demo.html` for testing
   - Character reference sheet

## Step 5: Font Subsetting (Optional)

To reduce file size, include only the glyphs you need:

```bash
# Using fonttools to subset
pyftsubset myicons.ttf \
  --unicodes=U+E001,U+E002,U+E003 \
  --flavor=woff2 \
  --output-file=myicons-subset.woff2
```

## Step 6: Implement in Your Project

### Add @font-face Declaration

```css
@font-face {
  font-family: 'MyCustomIcons';
  src: url('./fonts/myicons.woff2') format('woff2'),
       url('./fonts/myicons.woff') format('woff'),
       url('./fonts/myicons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
```

### Create CSS Classes

```css
.icon {
  font-family: 'MyCustomIcons';
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-bold::before {
  content: "\e001";
}

.icon-italic::before {
  content: "\e002";
}

.icon-link::before {
  content: "\e003";
}
```

### Usage in HTML

```html
<!-- Using CSS classes -->
<span class="icon icon-bold" aria-hidden="true"></span>

<!-- With accessible text -->
<button>
  <span class="icon icon-bold" aria-hidden="true"></span>
  <span class="sr-only">Bold</span>
</button>
```

## Step 7: VS Code Extension Integration

For VS Code extensions, add icon fonts to your extension package:

### Update package.json

```json
{
  "contributes": {
    "icons": {
      "custom-bold": {
        "description": "Custom bold icon",
        "default": {
          "fontPath": "./assets/fonts/myicons.woff",
          "fontCharacter": "\\e001"
        }
      }
    }
  }
}
```

### Use in Status Bar Items

```typescript
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);

statusBarItem.text = "$(custom-bold) Bold";
statusBarItem.command = 'extension.toggleBold';
```

## Accessibility Best Practices

1. **Hide decorative icons from screen readers**

   ```html
   <span class="icon icon-star" aria-hidden="true"></span>
   ```

2. **Provide alternative text for meaningful icons**

   ```html
   <span class="icon icon-warning" role="img" aria-label="Warning"></span>
   ```

3. **Use semantic HTML when possible**

   ```html
   <button type="button">
     <span class="icon icon-save" aria-hidden="true"></span>
     Save Document
   </button>
   ```

## Browser Compatibility

| Format | IE | Edge | Firefox | Chrome | Safari |
|--------|----|----- |---------|--------|--------|
| WOFF2  | ❌ | 14+  | 39+     | 36+    | 10+    |
| WOFF   | 9+ | 12+  | 3.6+    | 5+     | 5.1+   |
| TTF    | 9+ | 12+  | 3.5+    | 4+     | 3.1+   |

### Fallback Strategy

```css
@font-face {
  font-family: 'MyCustomIcons';
  src: url('myicons.woff2') format('woff2'),
       url('myicons.woff') format('woff'),
       url('myicons.ttf') format('truetype');
}

/* Fallback for very old browsers */
.no-fontface .icon-bold {
  background-image: url('icons/bold.png');
  width: 16px;
  height: 16px;
  text-indent: -9999px;
}
```

## Licensing Considerations

1. **Custom icons**: Choose an appropriate license (MIT, Apache 2.0, etc.)
2. **Third-party SVGs**: Verify licensing terms and attribution requirements
3. **Font tools**: Check tool licenses if distributing generated fonts commercially

## Performance Tips

1. **Preload critical icon fonts**

   ```html
   <link rel="preload" href="fonts/myicons.woff2" as="font" type="font/woff2" crossorigin>
   ```

2. **Use font-display for better loading**

   ```css
   @font-face {
     font-family: 'MyCustomIcons';
     font-display: swap; /* or block, fallback, optional */
     /* ... other properties */
   }
   ```

3. **Subset fonts aggressively**
   - Only include glyphs you actually use
   - Remove unnecessary font features and tables

## Troubleshooting

### Common Issues

**Icons not displaying:**

- Check font file paths in CSS
- Verify CORS headers for cross-origin requests
- Ensure proper MIME types are set on server

**Incorrect characters showing:**

- Verify Unicode codepoints match CSS content values
- Check font encoding and character mapping

**Poor rendering quality:**

- Add CSS font smoothing properties
- Ensure SVG paths are optimized
- Check font hinting settings

### Debugging Tools

- Browser Developer Tools Network tab
- Font loading APIs: `document.fonts.ready`
- FontForge for font file inspection

## Example Project Structure

```text
project/
├── assets/
│   ├── fonts/
│   │   ├── myicons.woff2
│   │   ├── myicons.woff
│   │   └── myicons.ttf
│   └── css/
│       └── icons.css
├── src/
│   └── icons/
│       ├── bold.svg
│       ├── italic.svg
│       └── link.svg
└── tools/
    └── generate-icons.js
```

## Conclusion

Custom WOFF icon fonts provide an efficient, scalable solution for icon delivery in web applications and VS Code extensions. By following this guide, you can create professional-quality icon fonts that enhance your user interface while maintaining excellent performance and accessibility.

For more advanced use cases, consider exploring modern alternatives like SVG sprites or CSS-in-JS icon solutions, but WOFF fonts remain an excellent choice for most projects requiring custom iconography.
