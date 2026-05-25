#!/usr/bin/env python3

import json
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
HOST = "0.0.0.0"
PORT = 8000

# HDMI-CEC User Control codes.
# These assume the Pi is logical address 1 sending to TV address 0.
CEC_COMMANDS = {
    "power": ["on 0"],
    "standby": ["standby 0"],

    "select": ["tx 10:44:00", "tx 10:45"],
    "up": ["tx 10:44:01", "tx 10:45"],
    "down": ["tx 10:44:02", "tx 10:45"],
    "left": ["tx 10:44:03", "tx 10:45"],
    "right": ["tx 10:44:04", "tx 10:45"],

    "home": ["tx 10:44:09", "tx 10:45"],
    "menu": ["tx 10:44:0A", "tx 10:45"],
    "back": ["tx 10:44:0D", "tx 10:45"],
    "exit": ["tx 10:44:0D", "tx 10:45"],

    "vol_up": ["tx 10:44:41", "tx 10:45"],
    "vol_down": ["tx 10:44:42", "tx 10:45"],
    "mute": ["tx 10:44:43", "tx 10:45"],

    "play_pause": ["tx 10:44:46", "tx 10:45"],
    "rewind": ["tx 10:44:48", "tx 10:45"],
    "fast_forward": ["tx 10:44:49", "tx 10:45"],

    "input": ["tx 10:44:34", "tx 10:45"],
    "info": ["tx 10:44:35", "tx 10:45"],
}


def run_cec(commands):
    full_script = "\n".join(commands) + "\n"

    result = subprocess.run(
        ["cec-client", "-s", "-d", "1"],
        input=full_script,
        text=True,
        capture_output=True,
        timeout=5,
    )

    output = (result.stdout + result.stderr).strip()

    if result.returncode != 0:
        raise RuntimeError(output or f"cec-client exited with {result.returncode}")

    return output


class CECRemoteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def do_POST(self):
        if self.path != "/api/cec":
            self.send_json({"error": "Not found"}, status=404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(body or "{}")

            command_name = payload.get("command")

            if command_name not in CEC_COMMANDS:
                self.send_json({"error": f"Unknown command: {command_name}"}, status=400)
                return

            output = run_cec(CEC_COMMANDS[command_name])
            self.send_json({"ok": True, "command": command_name, "output": output})

        except subprocess.TimeoutExpired:
            self.send_json({"error": "CEC command timed out"}, status=504)
        except Exception as error:
            self.send_json({"error": str(error)}, status=500)

    def send_json(self, payload, status=200):
        data = json.dumps(payload, indent=2).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    print(f"Serving repo root: {REPO_ROOT}")
    print(f"CEC remote: http://jins-pi.local:{PORT}/dead/experiments/cec-remote/")
    print("Do not expose this to the public internet unless you enjoy inventing cursed appliances.")

    server = ThreadingHTTPServer((HOST, PORT), CECRemoteHandler)
    server.serve_forever()
