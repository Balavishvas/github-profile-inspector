#!/usr/bin/env python3
"""Local server for the GitHub Profile Inspector Web Frontend."""

import argparse
import json
import mimetypes
import os
import socket
import sys
import threading
import time
import urllib.parse
import webbrowser
from http import HTTPStatus
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Import inspector logic from same directory
import profile_inspector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


class InspectorRequestHandler(SimpleHTTPRequestHandler):
    """Custom request handler that serves the frontend and handles /api calls."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def log_message(self, format, *args):
        # Concise console logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}\n")

    def _send_json_response(self, data, status=HTTPStatus.OK):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Health endpoint
        if path == "/api/health":
            self._send_json_response({"status": "ok", "version": "1.0.0", "python": sys.version})
            return

        # Profile inspection API endpoint
        if path == "/api/inspect":
            username = query.get("username", [""])[0].strip()
            token = query.get("token", [None])[0]
            if not username:
                self._send_json_response({"error": "Missing 'username' query parameter"}, status=HTTPStatus.BAD_REQUEST)
                return

            try:
                data = profile_inspector.inspect_user(username, token=token)
                data["cli_summary"] = profile_inspector.format_summary_text(data["profile"], data.get("metrics"))
                self._send_json_response(data)
            except Exception as exc:
                status_code = HTTPStatus.BAD_REQUEST
                if "404" in str(exc) or "not found" in str(exc).lower():
                    status_code = HTTPStatus.NOT_FOUND
                elif "403" in str(exc) or "rate limit" in str(exc).lower():
                    status_code = HTTPStatus.TOO_MANY_REQUESTS
                self._send_json_response({"error": str(exc)}, status=status_code)
            return

        # Fallback to serving static files from frontend/
        return super().do_GET()


def is_port_in_use(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0


def find_available_port(start_port=8000, max_attempts=20):
    port = start_port
    for _ in range(max_attempts):
        if not is_port_in_use(port):
            return port
        port += 1
    return start_port


def main():
    parser = argparse.ArgumentParser(description="Run GitHub Profile Inspector Web UI")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default 8000)")
    parser.add_argument("--host", default="127.0.0.1", help="Host binding (default 127.0.0.1)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically open the web browser")
    args = parser.parse_args()

    # Ensure frontend directory exists
    if not os.path.isdir(FRONTEND_DIR):
        print(f"Error: Frontend directory not found at: {FRONTEND_DIR}")
        return 1

    port = args.port
    if is_port_in_use(port, args.host):
        alt_port = find_available_port(port + 1)
        print(f"Notice: Port {port} is occupied. Using port {alt_port} instead.")
        port = alt_port

    server_address = (args.host, port)
    server_url = f"http://{args.host}:{port}"

    print("=" * 60)
    print(" [*] GitHub Profile Inspector - Web Frontend")
    print("=" * 60)
    print(f" * Serving at: {server_url}")
    print(f" * Backend API: {server_url}/api/inspect?username=<user>")
    print(" * Press Ctrl+C to stop the server")
    print("=" * 60)

    httpd = HTTPServer(server_address, InspectorRequestHandler)

    if not args.no_browser:
        def open_browser():
            time.sleep(0.7)
            webbrowser.open(server_url)

        threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server gracefully...")
    finally:
        httpd.server_close()
        print("Server stopped.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
