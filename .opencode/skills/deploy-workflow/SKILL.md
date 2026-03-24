---
name: deploy-workflow
description: Commit and push after completed file changes.
---

Use this skill for any task that changes tracked files.

CRITICAL: After finishing the change, do not stop at editing files.

Required workflow:
1. Review the diff.
2. Create a clear git commit.
3. Push to the tracked remote branch.

The task is not complete until the push succeeds.

Every push triggers the Vercel deployment workflow.
