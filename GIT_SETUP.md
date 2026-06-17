# Git Auto-Commit Setup Guide

## Option 1: Manual Commits (VS Code)

1. **Open the Source Control view** (Ctrl+Shift+G)
2. **Enter commit message** in the text box
3. **Click the commit button** (✓) to commit
4. **Click the sync button** (↻) to push to GitHub

---

## Option 2: Automatic Commits via PowerShell Task Scheduler (Recommended for Windows)

### Step 1: Create a PowerShell script
Create a file `auto-commit.ps1` in your project root:

```powershell
# Navigate to project directory
cd "z:\Coverage website\vhf-coverage-simulation"

# Configure Git
git config user.name "VHF Project"
git config user.email "your-email@example.com"

# Check and commit changes
$status = git status --porcelain
if ($status) {
    git add -A
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "auto: update project - $timestamp"
    git push origin master
    Write-Host "✓ Changes committed and pushed at $timestamp"
} else {
    Write-Host "✓ No changes to commit"
}
```

### Step 2: Create a Scheduled Task

1. **Open Task Scheduler** (Ctrl+Alt+Delete → Task Manager → File → New Task)
2. **Create Basic Task:**
   - **Name:** VHF-Auto-Commit
   - **Trigger:** Hourly (or your preference)
   - **Action:** Start a program
     - Program: `powershell.exe`
     - Arguments: `-ExecutionPolicy Bypass -File "z:\Coverage website\vhf-coverage-simulation\auto-commit.ps1"`

---

## Option 3: GitHub Actions (Automatic on every push)

The `.github/workflows/auto-commit.yml` file is already configured. It will:
- Automatically commit changes when you push to the repository
- Run on every push to master/main branch

---

## Option 4: Git Hooks (Advanced)

To run auto-commit on every local commit:

1. Create `.git/hooks/post-commit` file with the auto-commit script
2. Make it executable
3. Every time you commit locally, it automatically pushes

---

## Quick Commands

### Manual commit and push:
```bash
cd "z:\Coverage website\vhf-coverage-simulation"
git add -A
git commit -m "description of changes"
git push origin master
```

### Check status:
```bash
git status
git log --oneline -5
```

### View commits on GitHub:
Visit: https://github.com/thangdtvt1992/cns/commits/master
