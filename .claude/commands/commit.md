---
description: Create a commit from staged changes
model: sonnet
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git commit:*)
---
## Context
- Status: !`git status --short`
- Diff: !`git diff --cached`

## Task
Write a conventional commit message for these changes and commit.

