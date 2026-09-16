# GitHub Profile Inspector

A small Python CLI that reads a public GitHub profile through the GitHub REST API and prints a compact summary.

## Features

- Fetches public profile information
- Shows repository, follower, and following counts
- Displays the profile URL and bio
- Uses only Python's standard library

## Run

```bash
python profile_inspector.py Balavishvas
```

## Example output

```text
GitHub Profile: @Balavishvas
--------------------------------
Name        : Not provided
Public repos: 20
Followers   : 0
Following   : 0
Profile     : https://github.com/Balavishvas
Bio         : ...
```

The example values are placeholders; the tool fetches current public values when it runs.
