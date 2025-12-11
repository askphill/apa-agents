# Compound Learning Skill

## Purpose

Extract actionable learnings from orchestration sessions to create a compounding knowledge effect where each task improves future tasks.

## When to Use
- After QA passes (capture success patterns)
- After QA fails but before retry (capture failure patterns)
- After escalation (capture what went wrong)

## Prerequisites
- Session log file path
- Task JSON with outcomes
- Access to knowledge base files

## Files to Read
1. Task JSON at `.claude/tasks/{slug}.json`
2. Session log at `.claude/logs/{session-id}.jsonl`
3. Existing knowledge base:
   - `.claude/knowledge/patterns.md`
   - `.claude/knowledge/anti-patterns.md`

## Outputs
- Learnings file at `.claude/learnings/{task-slug}-{timestamp}.md`
- Updated knowledge base files (if new patterns found)
- Updated metrics.json
- Task JSON compound section

## Analysis Methodology

### Phase 1: Context Gathering

```bash
# Read task JSON for outcomes
cat .claude/tasks/{task-slug}.json | jq '.meta, .qa'

# Read session log for tool usage
cat .claude/logs/{session-id}.jsonl | jq -s '
  group_by(.event_type) |
  map({type: .[0].event_type, count: length})
'

# Check QA results specifically
cat .claude/tasks/{task-slug}.json | jq '.qa.verification_results'
```

### Phase 2: Pattern Identification

**Success Indicators:**
- First-pass QA success
- Below-average tool call count
- No error events in log
- Clean theme check output

**Failure Indicators:**
- Multiple QA attempts
- Error events in log
- Theme check warnings/errors
- Escalation triggered

### Phase 3: Root Cause Analysis (for failures)

Use the "5 Whys" technique:

1. **What failed?** → QA criterion X failed
2. **Why did it fail?** → Missing element in schema
3. **Why was it missing?** → Planner didn't specify it
4. **Why didn't planner specify?** → No similar task reference
5. **Root cause** → Knowledge gap in planning phase

### Phase 4: Learnings Documentation

Write learnings file to `.claude/learnings/{task-slug}-{timestamp}.md`:

```markdown
# Session Learnings: {Task Name}

**Date:** {timestamp}
**Session ID:** {session-id}
**Duration:** {duration}

## Outcome Summary

| Metric | Value |
|--------|-------|
| Status | {pass/fail/escalated} |
| QA Attempts | {number} |
| Tool Calls | {number} |
| Errors | {number} |

## What Worked Well

### Pattern: {Name}

**Description:** {What the pattern does}

**Files involved:**
- `{file-path-1}:{line-range}`
- `{file-path-2}:{line-range}`

**Why it worked:** {Explanation}

**Reusable:** Yes/No

## What Didn't Work

### Issue: {Name}

**Description:** {What went wrong}

**Root cause:** {5 Whys result}

**Files involved:**
- `{file-path}:{line-number}`

**How it was fixed:** {Resolution}

**Prevention:** {How to avoid in future}

## Recommendations

### For Similar Tasks

1. {Specific recommendation with rationale}
2. {Specific recommendation with rationale}

### Skill Updates Proposed

| Skill | Proposed Change | Rationale |
|-------|-----------------|-----------|
| {skill} | {change} | {why} |

## Tags

`{task-type}` `{patterns-used}` `{outcome}`
```

### Phase 5: Knowledge Base Updates

#### Updating patterns.md

If successful pattern found, append:

```markdown
## Pattern: {Name}

**Added:** {date}
**Source:** {task-slug}
**Success count:** {n}

**Description:**
{What this pattern accomplishes}

**When to use:**
{Conditions where this applies}

**Implementation:**
{How to apply - reference actual files, not hardcoded code}

**References:**
- Original task: `.claude/learnings/{task-slug}-{timestamp}.md`
- Files: `{file-paths}`

---
```

#### Updating anti-patterns.md

If failure pattern found, append:

```markdown
## Anti-Pattern: {Name}

**Added:** {date}
**Source:** {task-slug}
**Failure count:** {n}

**Description:**
{What this anti-pattern looks like}

**Why it fails:**
{Root cause explanation}

**Detection:**
{How to spot this during planning/coding}

**Prevention:**
{Specific steps to avoid}

**Related QA checks:**
- {Check that would catch this}

---
```

### Phase 6: Metrics Update

Update `.claude/knowledge/metrics.json`:

```json
{
  "total_sessions": "previous + 1",
  "first_pass_successes": "previous + (firstPass ? 1 : 0)",
  "first_pass_rate": "first_pass_successes / total_sessions",
  "total_qa_attempts": "previous + qa_attempts",
  "average_qa_attempts": "total_qa_attempts / total_sessions",
  "patterns_identified": "previous + new_patterns",
  "anti_patterns_identified": "previous + new_anti_patterns",
  "by_task_type": {
    "[taskType]": {
      "count": "previous + 1",
      "first_pass_rate": "..."
    }
  },
  "by_month": {
    "[currentMonth]": {
      "sessions": "previous + 1",
      "first_pass_rate": "..."
    }
  }
}
```

## Quality Checklist

Before completing compound phase:

- [ ] Learnings file has specific file references (not generic)
- [ ] Root cause identified for any failures
- [ ] Patterns are actionable (someone could apply them)
- [ ] Anti-patterns include prevention steps
- [ ] Metrics JSON is valid and updated
- [ ] Task JSON compound section is populated

## Anti-Patterns to Avoid in This Skill

- Generic observations like "the task completed successfully"
- Missing file path references
- Learnings that aren't actionable
- Skipping the metrics update
- Not reading the session log for details
- Hardcoded code examples instead of file references
