# QA Skill

## Purpose
Verify implemented code meets acceptance criteria using deterministic tools, security checks, and automated visual verification.

## When to Use
- Task JSON phase is "qa"
- Code has been committed and is ready for verification

## Prerequisites
- Code has been committed
- Task JSON has current task info
- `shopify theme dev` is running (for visual verification)

## Files to Read
1. `references/verification.md` - Verification procedures and checklists

## MCP Tools Available

### Chrome DevTools MCP
Best for:
- **Live inspection** during development
- **Debugging** JavaScript issues
- **Console monitoring** for errors
- **Network analysis** for performance
- **Real-time CSS adjustments**

### Playwright MCP
Best for:
- **Automated screenshots** at specific breakpoints
- **Screenshot comparison** against Figma
- **Automated interaction testing** (clicks, form fills)
- **Cross-browser testing** (if needed)
- **Reproducible test runs**

## Outputs
- Verification results
- PASS: Task marked `passes: true`, move to next task
- FAIL: Feedback for code skill (with specific issues)

## Process

### 0. File Integrity Check (ALWAYS FIRST)
Before any verification:
```bash
git status
git diff --stat HEAD~1
```
- Verify only expected files were changed
- **Alert user immediately** if files were deleted or modified unexpectedly
- Check no unrelated files were touched

### 1. Automated Checks
```bash
# Theme linting - MUST pass
shopify theme check

# TypeScript schema validation (if applicable)
pnpm schema:apply
```

### 2. Translation Check
- All schema labels use `t:` translation keys
- Translation keys exist in locale files
- No hardcoded text in schema or liquid

### 3. Security & Performance Review
Check for:
- XSS vulnerabilities (unescaped output)
- Hardcoded sensitive data
- JavaScript security issues
- Image lazy loading where appropriate
- Render-blocking resources

**Prompt user** if any concerns found - don't auto-fix security issues

### 4. Visual Verification
Using **Playwright MCP** for automated screenshots:
- Desktop (1024px+)
- Mobile (<1024px)
- Compare against Figma if available

Using **Chrome DevTools MCP** for inspection:
- Check console for errors
- Inspect element spacing/styles
- Monitor network requests

### 5. Functional Testing
- Test all interactive elements
- Verify settings work in theme editor
- Test presets (if any)

### 6. Accessibility Audit
- Semantic HTML structure
- Keyboard navigation
- Color contrast (4.5:1 minimum)

### 7. Record Verdict
Update task JSON with results

## 3-Attempt Limit

If a task fails QA 3 times:
1. Document all attempts
2. Analyze root cause
3. Propose solutions
4. **Escalate to user**

## Critical Alerts (Stop Immediately)

**STOP and alert user if:**
- Files were deleted without being part of the task
- Files were modified that weren't supposed to change
- Security vulnerabilities found
- Missing translation keys
- Breaking changes to existing functionality
