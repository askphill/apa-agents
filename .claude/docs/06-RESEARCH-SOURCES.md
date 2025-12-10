# APA Agent System - Research Sources & Key Insights

## Sources Analyzed

1. **Anthropic: Effective Harnesses for Long-Running Agents** (via Spec-driven Claude Code)
2. **HumanLayer: Writing a Good CLAUDE.md**
3. **Dex: Solving Hard Problems - Harness Engineering** (AI Engineer talk)
4. **Anthropic: Don't Build Agents, Build Skills Instead** (Barry & Mahesh talk)
5. **Theo: Cursor Agent Mode** (workflow breakdown)
6. **Brandon Redmond: Claude Code Revolution** (3-part series)

---

## 1. Anthropic: Effective Harnesses for Long-Running Agents

### Core Problem
> "Getting agents to make consistent progress across multiple contexts remains an open problem."

### Solution: Two-Agent Architecture
- **Initializer Agent**: Sets up environment, creates comprehensive task list, defines acceptance criteria
- **Coding Agent**: Works incrementally, one task at a time, leaves clean committable state

### Key Insights

**JSON over Markdown for task tracking:**
> "We landed on JSON because the model is less likely to inappropriately change or overwrite JSON files compared to markdown files."

**All tasks start as failing:**
> "These features were all initially marked as failing so that later coding agents would have a clear outline of what full functionality looked like."

**Strong guardrails:**
> "It's unacceptable to remove or edit tests because this could lead to missing or buggy functionality."

**Test before building:**
> "The agent would run a basic test before it even gets started to understand where it is, what's working, and if it needs to fix the code first."

**Git as checkpoint system:**
> "This allows the model to use git to revert bad code changes and recover working states."

### Application
- Our task JSON with `passes: false` by default
- 3-attempt limit before escalation
- Git commits per task
- Self-verification before QA handoff

---

## 2. HumanLayer: Writing a Good CLAUDE.md

### Core Problem
> "Claude Code's system prompt contains ~50 individual instructions. That's nearly a third of the instructions your agent can reliably follow."

### Key Findings

**Instruction limits:**
> "Frontier thinking LLMs can follow ~150-200 instructions with reasonable consistency."

**Uniform degradation:**
> "As instruction count increases, instruction-following quality decreases uniformly" - ALL instructions get ignored more, not just new ones.

**The system reminder:**
```
<system-reminder>
IMPORTANT: this context may or may not be relevant to your tasks.
You should not respond to this context unless it is highly relevant.
</system-reminder>
```

**Progressive disclosure:**
> "Keep task-specific instructions in separate markdown files... instruct Claude to decide which (if any) are relevant and to read them before it starts working."

**Pointers not copies:**
> "Don't include code snippets in these files if possible - they will become out-of-date quickly. Instead, include file:line references."

**LLMs are in-context learners:**
> "If your code follows a certain set of style guidelines or patterns, your agent should tend to follow existing code patterns and conventions without being told to."

**Don't auto-generate:**
> "CLAUDE.md is the highest leverage point of the harness... you should spend time thinking very carefully about every single line."

### Application
- CLAUDE.md under 60 lines
- Skills loaded on demand
- Pattern docs use file:line references
- Rely on gold standard sections as examples

---

## 3. Dex: Solving Hard Problems - Harness Engineering

### Core Problem
> "Most of the time you use AI for software engineering you're doing a lot of rework, a lot of codebase churn, and it doesn't really work well for complex tasks."

### The Dumb Zone
> "Around the 40% line is where you're going to start to see diminishing returns. If you have too many MCPs in your coding agent, you are doing all your work in the dumb zone."

### Research-Plan-Implement (RPI)

**Research:**
> "All about understanding how the system works, finding the right files, staying objective. Output: exact files and line numbers."

**Planning:**
> "Outline the exact steps. Include file names and line snippets. Be very explicit about how we're going to test things after every change."

**Implement:**
> "If you read one of these plans, you can see very easily how the dumbest model in the world is probably not going to screw this up."

### Leverage Hierarchy
> "A bad line of code is a bad line of code. A bad part of a plan could be a hundred bad lines of code. A bad line of research... your whole thing is going to be hosed."

**Review priority:**
1. Research (highest leverage)
2. Plan (high leverage)
3. Code (lowest leverage - it's regenerable)

### Trajectory Matters
> "If the conversation is 'wrong → yell → wrong → yell', the next most likely token is 'I better do something wrong so the human can yell at me again.'"

### On-Demand Context
> "On-demand compressed context > static documentation that gets stale"

### Don't Outsource Thinking
> "AI cannot replace thinking. It can only amplify the thinking you have done or the lack of thinking you have done."

### Application
- Human reviews plan, not code
- Keep context small per phase
- Fresh context on phase transitions
- Plan includes actual code snippets
- Research phase discovers existing blocks

---

## 4. Anthropic: Don't Build Agents, Build Skills Instead

### Core Insight
> "We stopped building agents and started building skills instead."

### What Are Skills
> "Skills are organized collections of files that package composable procedural knowledge for agents. In other words, they're folders."

### Why Files
> "We have used files as a primitive for decades and we like them. So why change now?"

### Scripts as Tools
> "Traditional tools have poorly written instructions... Code is self-documenting, modifiable, and can live in the file system until needed."

### Progressive Disclosure at Runtime
> "Only metadata is shown to the model. When an agent needs to use a skill, it can read in the rest of the skill.md."

### Three Skill Types
1. **Foundational** - New general capabilities
2. **Third-party** - Partners teaching Claude their products
3. **Enterprise/Team** - Company-specific best practices

### Skills + MCP
> "MCP is providing the connection to the outside world while skills are providing the expertise."

### Continuous Learning
> "Anything that Claude writes down can be used efficiently by a future version of itself."

### The Vision
> "When someone joins your team and starts using Claude for the first time, it already knows what your team cares about."

### Application
- Our 4 "agents" are actually 4 skills
- Pattern docs are also skills
- Skills loaded on demand
- Task JSON persists learning
- Composable: Plan skill + Pattern skills

---

## 5. Theo: Cursor Agent Mode

### Init Projects Yourself
> "I recommend that you actually init your projects yourself. It's a lot easier to get it right if you control the initial environment."

### Planning Model vs Execution Model
> "Use smart model (Opus) for plan, dumb model (Composer) for implementation."

### Work Trees
> "You can use work trees for parallel model comparison during QA... compare different models on the same task."

### The Code is Cheaper Now
> "Treat the PROMPT as the thing you're maintaining, not the code. You can just throw away bad attempts, update prompt, regenerate."

### Verification Harnesses
Key additions that improved success:
- `bun run dry-run` - Simpler test for faster feedback
- `bun run tsc` - Type checking
- Clear test that model can run

> "The models get so much smarter when you give them these little nuggets."

### Clone Repos as Docs
> "For underdocumented libraries, clone repo, point at tests as examples."

### PR + AI Review
> "I use Grapile/CodeRabbit... AI reviews AI code before merge."

### Knowing When to Bail
> "Sometimes it's worth pushing through, sometimes it's better to just go do it yourself. You gotta get a gut feel."

### Application
- Consider work trees for parallel attempts
- Plan is the artifact, code is regenerable
- Verification commands for QA skill
- AI review before human review

---

## 6. Brandon Redmond: Claude Code Series

### The Paradigm Shift
> "We're shifting from writing HOW to expressing WHAT."

### Hooks for Safety
Pre-tool-use hooks to block dangerous commands:
```python
DANGEROUS_PATTERNS = ['rm -rf /', 'sudo rm', ...]
```

### Multi-Agent Coordination
Key patterns:
- File locking to prevent conflicts
- Redis for task queue
- Quality gates before merging

### Real-Time Observability
- WebSocket dashboard for agent activity
- Event streaming from hooks
- Conflict detection

### Resource Management
> "Running 10+ Claude instances will max out your system."

### Application
- Hooks for auto-running theme check
- Potential for parallel work trees
- Observability for debugging

---

## Synthesis: Unified Principles

### 1. Context is Everything
- Stay under 40% context window
- Fresh context per phase if needed
- Task JSON bridges contexts

### 2. Progressive Disclosure
- CLAUDE.md routes to skills
- Skills load on demand
- Patterns loaded when coding

### 3. Less is More
- <60 line CLAUDE.md
- <200 line pattern docs
- Pointers not copies

### 4. Skills over Agents
- One agent, many skills
- Skills = procedural knowledge folders
- Composable and versionable

### 5. Deterministic Where Possible
- `shopify theme check` not Claude for linting
- Git for state management
- JSON for task tracking

### 6. Leverage Hierarchy
- Review plans, not code
- Human at highest leverage points
- Code is regenerable

### 7. Verification Harnesses
- Give agent commands to check its work
- Fast feedback loops
- Clear pass/fail criteria

### 8. Trust the Examples
- LLMs are in-context learners
- Gold standard code > written guidelines
- file:line references to real code
