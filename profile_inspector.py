#!/usr/bin/env python3
"""CLI & utility module that summarizes a public GitHub profile."""

import argparse
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen

GITHUB_API_BASE = "https://api.github.com"


def _make_request(url, token=None):
    headers = {
        "User-Agent": "github-profile-inspector",
        "Accept": "application/vnd.github.v3+json",
    }
    if token:
        headers["Authorization"] = f"token {token}"

    req = Request(url, headers=headers)
    try:
        with urlopen(req, timeout=12) as response:
            if response.status != 200:
                raise RuntimeError(f"GitHub API returned HTTP {response.status}")
            return json.load(response)
    except HTTPError as err:
        if err.code == 404:
            raise RuntimeError("GitHub user not found (404)") from err
        if err.code == 403:
            raise RuntimeError("GitHub API rate limit exceeded (403). Consider using a Personal Access Token.") from err
        raise RuntimeError(f"GitHub API error (HTTP {err.code}): {err.reason}") from err


def get_profile(username, token=None):
    """Fetch profile details for a given GitHub username."""
    url = f"{GITHUB_API_BASE}/users/{username}"
    return _make_request(url, token=token)


def get_repos(username, per_page=100, sort="pushed", token=None):
    """Fetch public repositories for a given GitHub username."""
    url = f"{GITHUB_API_BASE}/users/{username}/repos?per_page={per_page}&sort={sort}"
    return _make_request(url, token=token)


def inspect_user(username, token=None):
    """Fetch both profile and repositories, computing aggregated metrics."""
    profile = get_profile(username, token=token)
    repos = []
    try:
        repos = get_repos(username, per_page=30, token=token)
    except Exception:
        # Repos fetch is non-fatal if rate limited
        pass

    total_stars = sum(repo.get("stargazers_count", 0) for repo in repos)
    total_forks = sum(repo.get("forks_count", 0) for repo in repos)

    languages = {}
    for repo in repos:
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1

    return {
        "profile": profile,
        "repos": repos,
        "metrics": {
            "total_stars": total_stars,
            "total_forks": total_forks,
            "languages": languages,
        },
    }


def format_summary_text(profile, metrics=None):
    """Generate the formatted CLI text summary."""
    lines = [
        f"\nGitHub Profile: @{profile.get('login')}",
        "-" * 34,
        f"Name        : {profile.get('name') or 'Not provided'}",
        f"Public repos: {profile.get('public_repos', 0)}",
        f"Followers   : {profile.get('followers', 0)}",
        f"Following   : {profile.get('following', 0)}",
        f"Profile     : {profile.get('html_url')}",
        f"Bio         : {profile.get('bio') or 'Not provided'}",
    ]
    if metrics:
        lines.append(f"Total Stars : {metrics.get('total_stars', 0)} (from top repos)")
        top_langs = list(metrics.get("languages", {}).keys())[:4]
        if top_langs:
            lines.append(f"Top Langs   : {', '.join(top_langs)}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Inspect a public GitHub profile")
    parser.add_argument("username", help="GitHub username")
    parser.add_argument("--token", help="Optional GitHub Personal Access Token to avoid rate limits")
    parser.add_argument("--json", action="store_true", help="Output raw JSON data")
    args = parser.parse_args()

    try:
        data = inspect_user(args.username, token=args.token)
    except Exception as exc:
        print(f"Error: {exc}")
        return 1

    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(format_summary_text(data["profile"], data.get("metrics")))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

