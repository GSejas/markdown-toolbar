# 🎨 Codicons Reference Guide

This guide lists the validated VS Code Codicons used in the Markdown Extended Toolbar extension to ensure all icons render properly.

## ✅ Verified Working Codicons

### **Format Icons**
- `$(bold)` - Bold formatting ✅
- `$(italic)` - Italic formatting ✅  
- `$(text-size)` - Used for strikethrough (no native strikethrough icon) ✅

### **Structure Icons**
- `$(list-unordered)` - Bullet lists ✅
- `$(list-ordered)` - Numbered lists ✅
- `$(checklist)` - Task lists ✅
- `$(symbol-string)` - Headers ✅
- `$(comment)` - Blockquotes ✅

### **Code Icons**
- `$(code)` - Inline code ✅
- `$(terminal)` - Code blocks ✅

### **Media Icons**
- `$(link)` - Links ✅
- `$(file-media)` - Images ✅
- `$(clippy)` - Paste/clipboard ✅

### **Preview Icons**
- `$(preview)` - Preview ✅
- `$(eye)` - Enhanced preview ✅

### **Table Icons**
- `$(table)` - Table menu ✅
- `$(add)` - Insert table ✅
- `$(organization)` - Format table ✅

### **Quality Icons**
- `$(wrench)` - Fix issues ✅
- `$(pencil)` - Spell check ✅

### **Advanced Icons**
- `$(symbol-numeric)` - Math ✅
- `$(graph-line)` - Diagrams ✅
- `$(heart)` - Emoji picker ✅
- `$(markdown)` - Markdown ✅

## ❌ Invalid/Non-existent Codicons

These don't exist in the Codicons library:
- `$(strikethrough)` ❌ (use `$(text-size)` instead)
- `$(quote)` ❌ (use `$(comment)` instead)  
- `$(symbol-text)` ❌ (use `$(symbol-string)` instead)
- `$(list-flat)` ❌ (use `$(organization)` instead)
- `$(tools)` ❌ (use `$(wrench)` instead)
- `$(edit)` ❌ (use `$(pencil)` instead)
- `$(symbol-misc)` ❌ (use `$(symbol-numeric)` instead)
- `$(graph)` ❌ (use `$(graph-line)` instead)
- `$(smiley)` ❌ (use `$(heart)` instead)

## 🔍 How to Verify New Icons

1. **Check the official Codicons library**: https://microsoft.github.io/vscode-codicons/dist/codicon.html
2. **Test in VS Code**: Use Command Palette > "Insert Codicon"
3. **Browser test**: Load the CDN and inspect the CSS classes

## 🛠️ Usage Guidelines

### In TypeScript Files (`*.ts`)
```typescript
export const BUTTON_DEFINITIONS: Record<ButtonId, IButtonDefinition> = {
  'fmt.bold': {
    icon: '$(bold)', // ✅ Correct format
    // ...
  }
};
```

### In HTML Files (`*.html`)
```javascript
const BUTTONS = {
  'fmt.bold': { 
    icon: '$(bold)', // Will be converted to 'codicon codicon-bold'
    // ...
  }
};
```

### Conversion Logic
```javascript
// JavaScript converts: $(bold) → codicon codicon-bold
const iconClass = button.icon.replace('$(', 'codicon codicon-').replace(')', '');
```

## 🎯 Best Practices

1. **Always verify** new icons in the official Codicons reference
2. **Test locally** before committing icon changes
3. **Use semantic names** that match the button's function
4. **Fallback gracefully** - if an icon doesn't work, choose a close alternative
5. **Document changes** when updating icons

## 📋 Button Icon Mapping

| Button ID | Function | Icon | Codicon Class |
|-----------|----------|------|---------------|
| `fmt.bold` | Bold text | `$(bold)` | `codicon-bold` |
| `fmt.italic` | Italic text | `$(italic)` | `codicon-italic` |
| `fmt.strike` | Strikethrough | `$(text-size)` | `codicon-text-size` |
| `list.toggle` | Lists | `$(list-unordered)` | `codicon-list-unordered` |
| `task.toggle` | Tasks | `$(checklist)` | `codicon-checklist` |
| `code.inline` | Inline code | `$(code)` | `codicon-code` |
| `code.block` | Code block | `$(terminal)` | `codicon-terminal` |
| `link.insert` | Links | `$(link)` | `codicon-link` |
| `image.insert` | Images | `$(file-media)` | `codicon-file-media` |
| `preview.side` | Preview | `$(preview)` | `codicon-preview` |
| `table.menu` | Tables | `$(table)` | `codicon-table` |

## 🔄 Migration Guide

When updating from invalid to valid icons:

```diff
// OLD (invalid)
- icon: '$(strikethrough)'
- icon: '$(quote)'
- icon: '$(tools)'

// NEW (valid)  
+ icon: '$(text-size)'
+ icon: '$(comment)'
+ icon: '$(wrench)'
```

## 📚 Additional Resources

- [VS Code Codicons Gallery](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
- [Codicons GitHub Repository](https://github.com/microsoft/vscode-codicons)
- [VS Code Extension Icon Guidelines](https://code.visualstudio.com/api/references/icons-in-labels)

---

**Last Updated**: 2025-01-02  
**Verified Against**: VS Code Codicons v0.0.35