# Markdown Extended Toolbar Demo Documents

This folder contains demo documents designed to test different preset configurations and user journeys. Each document showcases specific features and use cases.

## 🎯 Test Presets Overview

| Preset | Use Case | Key Features | Demo Document |
|--------|----------|--------------|---------------|
| **test-minimal** | Basic editing | Bold, italic, headings | [`minimal-demo.md`](./minimal-demo.md) |
| **test-student** | Note-taking | Headers, lists, tasks, math | [`student-notes.md`](./student-notes.md) |
| **test-blogger** | Blog writing | Rich formatting, images, links | [`blog-post.md`](./blog-post.md) |
| **test-developer** | Documentation | Code blocks, tables, diagrams | [`api-documentation.md`](./api-documentation.md) |
| **test-researcher** | Academic | Citations, footnotes, math | [`research-paper.md`](./research-paper.md) |
| **test-presenter** | Presentations | Slides, visuals, highlights | [`presentation.md`](./presentation.md) |
| **test-qa** | FAQ format | Q&A structure, tasks | [`faq-document.md`](./faq-document.md) |
| **test-mobile** | Mobile editing | Compact, essential tools | [`mobile-notes.md`](./mobile-notes.md) |
| **test-power** | Advanced users | All features enabled | [`power-user.md`](./power-user.md) |
| **test-accessibility** | Accessible content | Semantic structure | [`accessible-content.md`](./accessible-content.md) |

## 🔄 Testing the Preset Cycling Feature

1. **Enable Debug Mode**: Set `"mdToolbar.debugMode": true` in your VS Code settings
2. **Open any demo document** in markdown mode
3. **Look for the 🔄 button** in your status bar (debug mode only)
4. **Click the 🔄 button** to cycle through all test presets
5. **Observe how the toolbar changes** for each preset

## 📝 User Journey Testing

### Journey 1: Student Taking Notes
1. Open [`student-notes.md`](./student-notes.md)
2. Switch to `test-student` preset
3. Practice: Adding headings, creating task lists, inserting math formulas

### Journey 2: Developer Writing Docs
1. Open [`api-documentation.md`](./api-documentation.md)
2. Switch to `test-developer` preset  
3. Practice: Code blocks, tables, mermaid diagrams, TOC generation

### Journey 3: Blogger Creating Content
1. Open [`blog-post.md`](./blog-post.md)
2. Switch to `test-blogger` preset
3. Practice: Rich formatting, image insertion, link creation

### Journey 4: Researcher Writing Paper
1. Open [`research-paper.md`](./research-paper.md)
2. Switch to `test-researcher` preset
3. Practice: Citations, footnotes, mathematical formulas, structured headers

## 🛠️ Feature Testing Checklist

### Core Formatting
- [ ] Bold text formatting
- [ ] Italic text formatting  
- [ ] Strikethrough text
- [ ] Inline code
- [ ] Code blocks

### Structure Elements
- [ ] Header levels (H1-H6)
- [ ] Bullet lists
- [ ] Numbered lists
- [ ] Task lists
- [ ] Blockquotes
- [ ] Horizontal rules

### Advanced Features
- [ ] Link insertion
- [ ] Image insertion
- [ ] Table creation/formatting
- [ ] Math formulas (inline/block)
- [ ] Mermaid diagrams
- [ ] TOC generation
- [ ] Footnotes

### UI/UX Testing
- [ ] Preset switching
- [ ] Debug mode cycling
- [ ] Context-aware button states
- [ ] Extension dependency detection
- [ ] Mobile-friendly layout

## 🐛 Bug Reporting

If you find issues while testing:

1. Note the **preset being used**
2. Record the **specific action taken**
3. Describe the **expected vs actual behavior**
4. Include **VS Code version** and **extension version**
5. Check **console logs** for errors

## 💡 Tips for Effective Testing

- **Test each preset systematically** using its corresponding demo document
- **Pay attention to button availability** - some features require external extensions
- **Try edge cases** - empty documents, large documents, complex formatting
- **Test keyboard shortcuts** alongside toolbar buttons
- **Verify undo/redo functionality** after each operation

Happy testing! 🎉