# APA Agent System - Task JSON Schema

## Purpose

Task JSON is the **persistent state** that bridges context windows. It tracks:
- What needs to be built
- What's been completed
- Current phase
- QA results and history
- Escalations and issues

**Why JSON not Markdown?** Research shows agents are less likely to inappropriately modify JSON files compared to markdown.

---

## File Location

```
.apa/tasks/[slug].json
```

Example: `.apa/tasks/featured-collection-grid.json`

---

## Complete Schema

```json
{
  "meta": {
    "id": "uuid-v4",
    "slug": "feature-slug",
    "name": "Human Readable Feature Name",
    "created_at": "2025-12-10T10:00:00Z",
    "updated_at": "2025-12-10T10:00:00Z",
    "status": "planning|coding|qa|documentation|review|complete|blocked",
    "current_phase": "planning|coding|qa|documentation|review"
  },
  
  "sources": {
    "figma_url": "https://figma.com/...",
    "figma_node_id": "123:456",
    "ticket_url": "https://...",
    "ticket_content": "Original ticket text if any"
  },
  
  "discovery": {
    "section_purpose": "What this section does",
    "figma_observations": {
      "layout": "Description of layout",
      "content_types": ["text", "image", "product"],
      "responsive_notes": "How it changes across breakpoints",
      "interactions": ["slider", "accordion"]
    },
    "block_analysis": {
      "existing_reusable": [
        { "name": "text", "reason": "Standard text block works" }
      ],
      "existing_extendable": [],
      "new_required": [
        { "name": "product-card-grid", "reason": "Need custom grid layout" }
      ]
    },
    "user_clarifications": [
      { "question": "Should this support app blocks?", "answer": "No" }
    ]
  },
  
  "requirements": {
    "content_types": ["heading", "products", "collection"],
    "schema_settings": {
      "section_level": [
        { "id": "heading", "type": "text" },
        { "id": "collection", "type": "collection" }
      ],
      "notes": "Any special notes about settings"
    },
    "blocks": {
      "accepts_theme_blocks": false,
      "accepts_app_blocks": false,
      "explicit_blocks": ["product-card"],
      "static_blocks": [
        { "type": "section-header", "id": "header", "position": "top" }
      ],
      "private_blocks_needed": ["_collection-filters"]
    },
    "responsive": {
      "desktop": "4 column grid",
      "tablet": "2 column grid",
      "mobile": "1 column stack"
    },
    "interactions": [
      { "type": "pagination", "details": "Load more button" }
    ]
  },
  
  "complexity_flags": {
    "new_snippets_created": false,
    "metafields_used": false,
    "metaobjects_used": false,
    "custom_js_required": true,
    "notes": "JS needed for load more functionality"
  },
  
  "tasks": [
    {
      "id": "task-1",
      "order": 1,
      "phase": "coding",
      "description": "Create product-card block with schema",
      "files_to_create": ["blocks/product-card.liquid"],
      "files_to_modify": [],
      "depends_on": [],
      "passes": false,
      "attempts": 0,
      "verification_notes": "",
      "commit_hash": "",
      "completed_at": null
    },
    {
      "id": "task-2",
      "order": 2,
      "phase": "coding",
      "description": "Create _collection-filters private block",
      "files_to_create": ["blocks/_collection-filters.liquid"],
      "files_to_modify": [],
      "depends_on": [],
      "passes": false,
      "attempts": 0,
      "verification_notes": "",
      "commit_hash": "",
      "completed_at": null
    },
    {
      "id": "task-3",
      "order": 3,
      "phase": "coding",
      "description": "Create section liquid structure",
      "files_to_create": ["sections/featured-collection-grid.liquid"],
      "files_to_modify": [],
      "depends_on": ["task-1", "task-2"],
      "passes": false,
      "attempts": 0,
      "verification_notes": "",
      "commit_hash": "",
      "completed_at": null
    }
  ],
  
  "acceptance_criteria": [
    {
      "id": "ac-1",
      "category": "visual",
      "description": "Section matches Figma design at desktop width",
      "verification_method": "Visual comparison via Chrome DevTools",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-2",
      "category": "visual",
      "description": "Section matches Figma at tablet breakpoint",
      "verification_method": "Visual comparison at 768px",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-3",
      "category": "functional",
      "description": "Load more button fetches and displays additional products",
      "verification_method": "Click test",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-4",
      "category": "accessibility",
      "description": "All interactive elements keyboard accessible",
      "verification_method": "Tab navigation test",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-5",
      "category": "accessibility",
      "description": "Color contrast meets WCAG 2.1 AA",
      "verification_method": "Contrast checker",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-6",
      "category": "content",
      "description": "Empty collection state displays appropriately",
      "verification_method": "Test with empty collection",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-7",
      "category": "seo",
      "description": "Semantic HTML structure with proper heading hierarchy",
      "verification_method": "HTML inspection",
      "met": false,
      "verified_by": "",
      "verified_at": null
    },
    {
      "id": "ac-8",
      "category": "performance",
      "description": "Images use lazy loading",
      "verification_method": "Network tab inspection",
      "met": false,
      "verified_by": "",
      "verified_at": null
    }
  ],
  
  "qa_reviews": [
    {
      "id": "qa-1",
      "task_id": "task-1",
      "attempt": 1,
      "timestamp": "2025-12-10T11:00:00Z",
      "verdict": "FAIL",
      "theme_check": {
        "passed": true,
        "errors": [],
        "warnings": []
      },
      "visual_check": {
        "passed": false,
        "notes": "Spacing doesn't match Figma"
      },
      "functional_check": {
        "passed": true,
        "notes": ""
      },
      "a11y_check": {
        "passed": true,
        "notes": ""
      },
      "issues_found": [
        "Product card padding is 16px, should be 24px per Figma"
      ],
      "feedback_given": "Adjust padding in product-card block to 24px"
    }
  ],
  
  "escalations": [
    {
      "id": "esc-1",
      "task_id": "task-1",
      "timestamp": "2025-12-10T12:00:00Z",
      "reason": "3 QA failures",
      "attempts_summary": [
        { "attempt": 1, "issue": "Wrong padding", "fix_tried": "Updated to 24px" },
        { "attempt": 2, "issue": "Still wrong on mobile", "fix_tried": "Added responsive padding" },
        { "attempt": 3, "issue": "Breaks in Safari", "fix_tried": "Changed flex to grid" }
      ],
      "agent_analysis": "Safari has known flexbox gap issues",
      "proposed_solutions": [
        { "option": "A", "description": "Use CSS grid instead", "tradeoff": "More complex CSS" },
        { "option": "B", "description": "Use margin instead of gap", "tradeoff": "Less clean code" }
      ],
      "user_decision": "",
      "user_decision_at": null,
      "resolved": false
    }
  ],
  
  "minor_issues": [
    {
      "id": "minor-1",
      "description": "Theme check warning about unused variable",
      "severity": "low",
      "file": "sections/featured-collection-grid.liquid",
      "line": 45,
      "suggestion": "Remove unused assign"
    }
  ],
  
  "outputs": {
    "section_file": "sections/featured-collection-grid.liquid",
    "block_files": [
      "blocks/product-card.liquid",
      "blocks/_collection-filters.liquid"
    ],
    "snippet_files": [],
    "js_files": ["assets/featured-collection-grid.js"],
    "css_files": [],
    "docs_client": "assets/apa-docs-featured-collection-grid.liquid",
    "docs_developer": ".apa/docs/featured-collection-grid.md"
  },
  
  "git_history": [
    {
      "hash": "abc123",
      "task_id": "task-1",
      "message": "[task-1] Create product-card block with schema",
      "timestamp": "2025-12-10T10:30:00Z"
    }
  ]
}
```

---

## Status Values

| Status | Meaning |
|--------|---------|
| `planning` | Discovery and planning in progress |
| `coding` | Implementation in progress |
| `qa` | Verification in progress |
| `documentation` | Generating docs |
| `review` | Final review against acceptance criteria |
| `complete` | All done, ready to merge |
| `blocked` | Escalated, waiting for human |

---

## Phase Transitions

```
planning → coding (when plan approved)
coding → qa (when task implemented)
qa → coding (on FAIL, if attempts < 3)
qa → coding (on PASS, if more tasks remain)
qa → documentation (on PASS, if all tasks complete)
qa → blocked (on FAIL, if attempts >= 3)
documentation → review (when docs generated)
review → complete (when acceptance criteria verified)
review → coding (if issues found in final review)
```

---

## Task State Machine

For each individual task:

```
┌──────────┐
│ pending  │ (passes: false, attempts: 0)
└────┬─────┘
     │ Code skill picks up
     ▼
┌──────────┐
│ building │ (in progress)
└────┬─────┘
     │ Code complete, commit made
     ▼
┌──────────┐
│ verifying│ (QA skill active)
└────┬─────┘
     │
     ├── PASS ──► ┌──────────┐
     │            │ complete │ (passes: true)
     │            └──────────┘
     │
     └── FAIL ──► ┌──────────┐
                  │ retry    │ (attempts += 1)
                  └────┬─────┘
                       │
                       ├── attempts < 3 ──► Back to building
                       │
                       └── attempts >= 3 ──► ┌──────────┐
                                             │ escalated│
                                             └──────────┘
```

---

## Minimal Task JSON (Starting Point)

When Plan skill creates a new task JSON:

```json
{
  "meta": {
    "id": "generated-uuid",
    "slug": "feature-slug",
    "name": "Feature Name",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "status": "planning",
    "current_phase": "planning"
  },
  "sources": {
    "figma_url": "",
    "figma_node_id": "",
    "ticket_url": "",
    "ticket_content": ""
  },
  "discovery": {},
  "requirements": {},
  "complexity_flags": {
    "new_snippets_created": false,
    "metafields_used": false,
    "metaobjects_used": false,
    "custom_js_required": false
  },
  "tasks": [],
  "acceptance_criteria": [],
  "qa_reviews": [],
  "escalations": [],
  "minor_issues": [],
  "outputs": {},
  "git_history": []
}
```

This gets populated during discovery and planning phases.
