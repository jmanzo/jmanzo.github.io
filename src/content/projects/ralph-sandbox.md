---
title: "ralph-sandbox: a locked-down container for autonomous coding agents"
description: "An open-source sandbox for running Claude Code or Codex in unattended mode: deny-by-default network egress, one workspace mount, no Docker socket, snapshots before every run, and a loop that works through a PRD one task at a time."
tier: featured
order: 80
kind: "Open source"
client: "My own tool, MIT licensed"
engagement: "Personal project, used daily on my own work"
role: "Author and maintainer"
period: "2026"
status: "Early, no tagged release yet; CI on Linux amd64 and arm64"
stack: ["Docker", "Bash", "tinyproxy", "GitHub Actions", "Claude Code", "Codex"]
links:
  - { label: "Source on GitHub", href: "https://github.com/jmanzo/ralph-sandbox" }
cover: "../../assets/projects/ralph-boundary.svg"
coverAlt: "Diagram: the agent container sits on an internal Docker network whose only way out is an allowlist proxy"
---

## The problem

Coding agents are most useful when they aren't stopping to ask permission for every file write and shell command. Running them that way on your own machine means one bad command away from your dotfiles, your SSH keys or your other repositories, and an agent with open internet can send anything it reads anywhere.

Docker's own Sandboxes product solves this well where it runs. I needed something for when it doesn't, and a boundary I could read end to end: a Dockerfile, a proxy config and two shell scripts, no daemon, nothing to trust that takes more than ten minutes to audit.

## The boundary

**Network.** The agent's container sits on a Docker network created with `--internal`, so it has no route off the host. A small proxy is the only container on both networks, and it refuses any host that isn't on an anchored allowlist. Because the block is at the route level, not DNS, a raw IP doesn't get out either, and UDP and ICMP have nowhere to go.

**Filesystem.** One workspace, in one of three modes: mounted read-write, read-only with the agent working on a private copy you review with `ralph diff` before `ralph apply`, or not mounted at all.

**Docker and privileges.** The Docker socket is never mounted and there's no Docker CLI in the image. The agent runs as an unprivileged user, and a hardened mode drops every capability.

**Recovery.** Before every run in read-write mode, the host takes a snapshot the sandbox can't reach: a hidden git ref plus a git bundle written outside the mount. An agent that runs `rm -rf .git` still can't take your history with it.

**Credentials and spend.** Logins live in a Docker volume, host API keys arrive through a mode-600 file instead of environment flags, and notification tokens never enter the sandbox. The loop has stall, repeated-failure, three-strikes and spend-ceiling guardrails.

Each of those claims has a CI test on Linux amd64 and arm64: egress blocked at the route level, the socket never exposed, root refused, capabilities dropped, snapshots surviving deletion of the whole workspace.

## The loop

On top of the boundary runs a [Ralph](https://www.aihero.dev/getting-started-with-ralph) loop: `ralph init` scaffolds a PRD and the state files, and `ralph loop` runs the same prompt against a fresh agent session, one task per iteration, until the PRD is satisfied. Each iteration has an orchestrator that delegates to architect, developer and QA subagents; the only memory between iterations is git history and a progress file. If Anthropic's limits run out mid-run, it hands over to Codex.

## What it shows

Security work stated honestly. The README has a table comparing each isolation layer with Docker Sandboxes, including the one where a plain container is weaker (a shared kernel instead of a microVM), and the security doc lists what the tool does not protect against.
