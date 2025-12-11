# Verification Procedures

## 0. File Integrity Check (ALWAYS FIRST)

Before ANY other verification:

```bash
# Check what changed
git status
git diff --stat HEAD~1

# List any deleted files
git diff --name-status HEAD~1 | grep "^D"
```

**STOP IMMEDIATELY AND ALERT USER IF:**
- Files were deleted that weren't part of the task
- Files were modified that weren't supposed to change
- Unexpected changes in unrelated directories

```
⚠️ UNEXPECTED FILE CHANGES DETECTED

The following files were modified but weren't part of this task:
- [file path]

The following files were deleted:
- [file path]

Please review before continuing. Should I:
1. Revert these changes
2. Continue anyway (confirm intentional)
3. Investigate what happened
```

---

## 1. Automated Checks (Required)

### Theme Check
```bash
shopify theme check
```
- Must pass with **no errors**
- Warnings should be reviewed
- If errors: FAIL immediately with specific error details

### Schema Apply (if TypeScript schemas used)
```bash
pnpm schema:apply
```
- Must complete without errors
- Verifies TypeScript compiles
- Confirms schema merges into liquid files

---

## 2. Translation Verification

### Schema Translations
Check all schema settings use translation keys:
```bash
# Find hardcoded labels in schema
grep -r '"label":' sections/ blocks/ --include="*.liquid" | grep -v 't:'
```

All labels should use `t:` prefix:
- `"label": "t:settings.color_scheme"` ✓
- `"label": "Color scheme"` ✗

### Locale Files
Verify keys exist:
```bash
# Check if translation key exists
grep "settings.color_scheme" locales/en.default.json
```

### Common Translation Patterns
```
t:settings.[setting_name]     - Setting labels
t:options.[option_value]      - Select options
t:names.[name]                - Block/section names
t:content.[header]            - Section headers
t:info.[key]                  - Info text
t:categories.[category]       - Categories
t:presets.[preset_name]       - Preset names
```

---

## 3. Security & Performance Review

### Security Checks

**XSS Prevention:**
```liquid
{# SAFE - escaped by default #}
{{ product.title }}

{# DANGEROUS - raw output #}
{{ product.description }}  {# Only if you trust the source #}
```

**Check for:**
- Unescaped user input
- Inline JavaScript with dynamic content
- External resource loading without integrity checks
- Hardcoded API keys or secrets

**If security concerns found:**
```
⚠️ SECURITY CONCERN DETECTED

File: sections/example.liquid:45
Issue: Unescaped output that could contain HTML

Code:
{{ product.metafields.custom.description }}

Risk: If metafield contains malicious HTML/JS, it will execute

Options:
1. Escape output: {{ product.metafields.custom.description | escape }}
2. Strip tags: {{ product.metafields.custom.description | strip_html }}
3. Keep as-is (confirm content is trusted)

How would you like to proceed?
```

### Performance Checks

**Image Loading:**
- Images below the fold should use `loading="lazy"`
- Large images should have appropriate sizes

**JavaScript:**
- No render-blocking scripts
- Defer non-critical JS

**CSS:**
- No unused CSS in stylesheet blocks
- CSS custom properties used where appropriate

---

## 4. Visual Verification

### Breakpoints
- **Desktop**: 1024px and above
- **Mobile**: Below 1024px

### Using Playwright MCP
```
Take screenshots at:
1. Desktop (1440px width)
2. Mobile (375px width)

Compare against Figma design if URL provided.
```

### Using Chrome DevTools MCP
```
1. Open the preview URL
2. Check console for errors
3. Inspect element spacing and styles
4. Verify computed CSS values
```

### Visual Checklist
- [ ] Layout matches design
- [ ] Spacing is correct
- [ ] Typography is correct
- [ ] Colors match color scheme
- [ ] Responsive behavior works
- [ ] No content overflow

---

## 5. Theme Editor Verification

### Settings Functionality
For each setting in the schema:
- [ ] Change the setting value
- [ ] Verify preview updates correctly
- [ ] Check default value is sensible

### Preset Verification (if any)
- [ ] Add section using each preset
- [ ] Verify correct settings applied
- [ ] Confirm preset name is translated

### Block Testing (if applicable)
- [ ] Add blocks in theme editor
- [ ] Reorder blocks
- [ ] Remove blocks
- [ ] Test each block type

---

## 6. Accessibility Audit

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Lists use `<ul>`, `<ol>`, `<dl>`
- [ ] Buttons are `<button>`, links are `<a>`
- [ ] Form elements have labels

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Focus order is logical
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Color & Contrast
- [ ] Text meets 4.5:1 contrast (AA)
- [ ] Large text meets 3:1 ratio
- [ ] Information not conveyed by color alone

---

## 7. Content Edge Cases

### Empty States
- [ ] No content provided
- [ ] Missing images
- [ ] Empty collection

### Content Limits
- [ ] Very long text
- [ ] Very short text
- [ ] Special characters
- [ ] RTL text (if supported)

---

## Failure Handling

### Feedback Format
```
FAIL: [task-id]

Issues Found:
1. [Category]: [Specific issue]
   File: [path:line]
   Fix: [What to change]

2. [Category]: [Specific issue]
   File: [path:line]
   Fix: [What to change]

Attempt: [X] of 3
```

### After 3 Failures - Escalation
```
ESCALATION REQUIRED: [task-id]

Issue Summary:
[What's failing after 3 attempts]

Attempt History:
1. [What was tried] → [Result]
2. [What was tried] → [Result]
3. [What was tried] → [Result]

Root Cause Analysis:
[Technical analysis of why this keeps failing]

Proposed Solutions:
A. [Option] - [Tradeoffs]
B. [Option] - [Tradeoffs]

Awaiting your decision...
```

---

## Quick Checklist

Before marking PASS:

**Integrity:**
- [ ] Only expected files changed
- [ ] No unexpected deletions

**Automated:**
- [ ] `shopify theme check` passes
- [ ] `pnpm schema:apply` succeeds (if TS)

**Translations:**
- [ ] All schema labels use `t:` keys
- [ ] Translation keys exist in locales

**Security:**
- [ ] No XSS vulnerabilities
- [ ] No hardcoded secrets
- [ ] User prompted on concerns

**Visual:**
- [ ] Matches design at desktop
- [ ] Matches design at mobile
- [ ] No console errors

**Theme Editor:**
- [ ] All settings work
- [ ] Presets work (if any)
- [ ] Blocks work (if any)

**Accessibility:**
- [ ] Keyboard accessible
- [ ] Semantic HTML
- [ ] Sufficient contrast
