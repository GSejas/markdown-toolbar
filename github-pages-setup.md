# 🌐 GitHub Pages Setup Guide

This guide walks you through setting up GitHub Pages for the Markdown Toolbar extension landing page.

## 📋 Prerequisites

- GitHub account
- Git installed on your machine
- Basic familiarity with GitHub repositories

## 🚀 Quick Setup (5 minutes)

### Step 1: Prepare Your Repository

1. **Create or navigate to your extension repository**
   ```bash
   # If creating new repository
   git clone https://github.com/YOUR_USERNAME/vscode-markdown-toolbar.git
   cd vscode-markdown-toolbar
   
   # If using existing repository
   cd your-existing-repo
   ```

2. **Ensure these files are in your repository root:**
   - `index.html` (main landing page)
   - `toolbar-designer.html` (full designer tool)
   - `_config.yml` (Jekyll configuration)
   - `.github/workflows/pages.yml` (deployment workflow)

### Step 2: Enable GitHub Pages

1. **Go to your repository on GitHub**
   - Navigate to `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

2. **Access repository settings**
   - Click the **Settings** tab (top navigation)
   - Scroll down to **Pages** in the left sidebar

3. **Configure Pages source**
   - Under **Source**, select: **GitHub Actions**
   - Leave other settings as default

### Step 3: Push and Deploy

1. **Commit all files to your repository**
   ```bash
   git add .
   git commit -m "Add GitHub Pages landing page and configuration"
   git push origin main
   ```

2. **Check deployment status**
   - Go to **Actions** tab in your GitHub repository
   - You should see a "Deploy to GitHub Pages" workflow running
   - Wait for the green checkmark (usually takes 2-3 minutes)

3. **Access your live site**
   - Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`
   - GitHub will also show the URL in Settings → Pages

## 🔧 Configuration Details

### Understanding `_config.yml`

```yaml
# Site metadata
title: "Markdown Toolbar Extension"
description: "Smart, context-aware markdown toolbar for VS Code"
url: "https://your-username.github.io"
baseurl: "/your-repo-name"

# Theme (optional - we use custom CSS)
theme: jekyll-theme-minimal

# Include HTML files (important!)
include:
  - "index.html"
  - "toolbar-designer.html"

# Exclude development files
exclude:
  - "node_modules"
  - "src"
  - "test"
  - "*.md"
  - "package.json"
  - "tsconfig.json"
```

### Understanding the GitHub Actions Workflow

The `.github/workflows/pages.yml` file:
- **Triggers**: Automatically runs on push to main/master branch
- **Permissions**: Configures necessary access for Pages deployment
- **Actions**: Uses official GitHub Pages actions for reliable deployment
- **Artifact**: Uploads the entire repository as the Pages content

## 🎨 Customization Options

### Custom Domain (Optional)

1. **Purchase a domain** (e.g., `markdowntoolbar.dev`)

2. **Add CNAME file** to repository root:
   ```
   markdowntoolbar.dev
   ```

3. **Configure DNS** with your domain provider:
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-username.github.io
   ```

4. **Update repository settings**:
   - Settings → Pages → Custom domain
   - Enter your domain name
   - Enable "Enforce HTTPS"

### Analytics (Optional)

Add Google Analytics to `index.html`:
```html
<!-- Add before closing </head> tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 📁 File Structure for GitHub Pages

```
your-repo/
├── index.html                    # Main landing page
├── toolbar-designer.html         # Full designer tool  
├── _config.yml                  # Jekyll configuration
├── .github/
│   └── workflows/
│       └── pages.yml            # Deployment workflow
├── CNAME                        # Custom domain (optional)
├── README.md                    # Repository documentation
├── src/                         # Extension source code
├── package.json                 # Extension manifest
└── ... (other extension files)
```

## 🔍 Troubleshooting

### Common Issues

**❌ Page not loading / 404 error**
- Check that `index.html` is in repository root
- Ensure `include` directive in `_config.yml` includes HTML files
- Verify the repository is public (or you have GitHub Pro for private Pages)

**❌ Deployment workflow failing**
- Check Actions tab for error details
- Ensure `pages.yml` is in `.github/workflows/` directory
- Verify repository permissions allow Actions

**❌ CSS/JS not loading**
- Use relative paths in HTML files
- Ensure all assets are committed to repository
- Check browser console for 404 errors on resources

**❌ Custom domain not working**
- Verify CNAME file contains only the domain name
- Check DNS propagation (can take up to 24 hours)
- Ensure domain DNS points to `username.github.io`

### Debugging Steps

1. **Check deployment status**:
   ```bash
   # View recent workflow runs
   gh run list --repo YOUR_USERNAME/YOUR_REPO_NAME
   
   # View specific run details
   gh run view RUN_ID --repo YOUR_USERNAME/YOUR_REPO_NAME
   ```

2. **Test locally with Jekyll**:
   ```bash
   # Install Jekyll (one-time setup)
   gem install bundler jekyll
   
   # Serve site locally
   jekyll serve
   
   # Access at http://localhost:4000
   ```

3. **Validate HTML**:
   - Use [W3C HTML Validator](https://validator.w3.org/)
   - Check for broken links with [W3C Link Checker](https://validator.w3.org/checklink)

## 🚀 Advanced Configuration

### Environment-Specific Settings

Update `_config.yml` for different environments:

```yaml
# Development
url: "http://localhost:4000"
baseurl: ""

# Production  
url: "https://your-username.github.io"
baseurl: "/your-repo-name"
```

### SEO Optimization

Add to `index.html` `<head>` section:
```html
<meta property="og:title" content="Markdown Toolbar Extension">
<meta property="og:description" content="Smart, context-aware markdown toolbar for VS Code">
<meta property="og:image" content="https://your-username.github.io/your-repo/preview.png">
<meta property="og:url" content="https://your-username.github.io/your-repo">
<meta name="twitter:card" content="summary_large_image">
```

### Performance Optimization

1. **Optimize images**:
   - Use WebP format for better compression
   - Include multiple sizes for responsive images
   - Consider lazy loading for below-fold content

2. **Minimize dependencies**:
   - Our setup uses CDN for Codicons (good)
   - Keep CSS inline for faster loading
   - Minimize JavaScript for core functionality

## 📊 Monitoring & Analytics

### GitHub Pages Analytics

Built-in insights available at:
`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/graphs/traffic`

### Setting Up Goals

If using Google Analytics, set up conversion goals:
- **Goal 1**: Clicks on "Install Extension" buttons
- **Goal 2**: Time spent on Designer page
- **Goal 3**: Configuration copies from mini-designer

## ✅ Launch Checklist

### Before Going Live
- [ ] Test all navigation links work
- [ ] Verify toolbar designer functionality
- [ ] Check responsive design on mobile
- [ ] Validate HTML and check for broken links
- [ ] Test page load speed (<3 seconds)
- [ ] Ensure all external links open in new tabs

### After Launch
- [ ] Submit to VS Code extension marketplace with website link
- [ ] Share on social media and developer communities
- [ ] Add website URL to GitHub repository description
- [ ] Monitor analytics and user feedback
- [ ] Set up Google Search Console for SEO insights

### Maintenance
- [ ] Update content when extension features change
- [ ] Monitor and fix any reported issues
- [ ] Keep dependencies (like Codicons CDN) up to date
- [ ] Regular content updates and improvements

## 🌟 Success Metrics

Track these KPIs for your landing page:
- **Page views** and unique visitors
- **Conversion rate** (visits → extension installs)
- **Engagement time** on designer page
- **Configuration copies** from mini-designer
- **Social shares** and referral traffic

Your landing page is now live and helping users discover your awesome extension! 🎉

---

**Need help?** Create an issue in your repository or reach out to the GitHub Pages community for support.