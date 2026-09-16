#!/usr/bin/env python3
"""Small CLI that summarizes a public GitHub profile."""

import argparse
import json
from urllib.request import Request, urlopen


def get_profile(username):
    url = f"https://api.github.com/users/{username}"
    request = Request(url, headers={"User-Agent": "github-profile-inspector"})
    with urlopen(request, timeout=10) as response:
        if response.status != 200:
            raise RuntimeError(f"GitHub API returned HTTP {response.status}")
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description="Inspect a public GitHub profile")
    parser.add_argument("username", help="GitHub username")
    args = parser.parse_args()

    try:
        profile = get_profile(args.username)
    except Exception as exc:
        print(f"Error: {exc}")
        return 1

    print(f"\nGitHub Profile: @{profile['login']}")
    print("-" * 32)
    print(f"Name        : {profile.get('name') or 'Not provided'}")
    print(f"Public repos: {profile['public_repos']}")
    print(f"Followers   : {profile['followers']}")
    print(f"Following   : {profile['following']}")
    print(f"Profile     : {profile['html_url']}")
    print(f"Bio         : {profile.get('bio') or 'Not provided'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
