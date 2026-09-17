# GitHub Profile Inspector & Analytics Suite

A modern developer analytics application and CLI that reads public GitHub profiles through the GitHub REST API and produces compact summaries and deep telemetry.

## Features

- 🌌 **Aesthetic Web UI**: Cyber-sleek dark glassmorphic interface with interactive telemetry.
- 📊 **Developer Analytics**: Shows total stars accrued, repositories, followers/following, and top language distribution.
- 🚀 **Interactive Repositories Explorer**: Filter and sort repositories by stars, forks, push dates, and names.
- 📟 **CLI & Terminal Sync**: Dual-view terminal drawer giving the exact formatted CLI summary.
- ⚡ **Zero External Dependencies**: Built entirely with Python's standard library and Vanilla Web standards.

---

## Quick Start (Web Frontend)

### 1. Launch with One Click

- **Windows Batch**: Double-click `run_app.bat`
- **PowerShell**: Run `./run_app.ps1`

### 2. Manual Start with Virtual Environment

```bash
# Activate virtual environment
.venv\Scripts\activate

# Launch local server (opens automatically at http://localhost:8000)
python server.py
```

Or run directly with `uv`:
```bash
uv run python server.py
```

---

## CLI Usage

You can also run the inspector directly from the command line:

```bash
uv run python profile_inspector.py Balavishvas
```

Or using the activated environment:
```bash
python profile_inspector.py Balavishvas
```

### CLI Example Output

```text
GitHub Profile: @Balavishvas
----------------------------------
Name        : Not provided
Public repos: 24
Followers   : 4
Following   : 11
Profile     : https://github.com/Balavishvas
Bio         : Not provided
Total Stars : 1 (from top repos)
Top Langs   : Python, JavaScript, Jupyter Notebook, CSS
```

