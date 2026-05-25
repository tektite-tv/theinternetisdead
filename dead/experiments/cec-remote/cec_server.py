#!/usr/bin/env python3

import atexit
import json
import subprocess
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
HOST = "0.0.0.0"
PORT = 8000

# The Pi is usually HDMI logical address 1 and the TV is usually 0.
# If your setup differs, run: echo "scan" | cec-client -s -d 1
CEC_SOURCE = "1"
CEC_TARGET = "0"

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


class PersistentCECClient:
    def __init__(self):
        self.process = None
        self.lock = threading.Lock()
        self.last_output = ""

    def start(self):
        with self.lock:
            if self.process and self.process.poll() is None:
                return

            self.process = subprocess.Popen(
                ["cec-client", "-d", "1"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            time.sleep(2.0)

            if self.process.poll() is not None:
                output = self._safe_read_startup_output()
                raise RuntimeError(f"cec-client exited during startup. {output}".strip())

            # Establish/announce the connection on startup.
            # scan wakes up the adapter discovery; as tells CEC who this device is.
            self._write_unlocked("scan")
            time.sleep(1.0)
            self._write_unlocked(f"as {CEC_SOURCE}")

    def send(self, commands):
        with self.lock:
            self.start()

            for command in commands:
                self._write_unlocked(command)
                time.sleep(0.08)

            return "CEC command sent"

    def _write_unlocked(self, command):
        if not self.process or self.process.poll() is not None:
            raise RuntimeError("cec-client is not running")

        if not self.process.stdin:
            raise RuntimeError("cec-client stdin is unavailable")

        self.process.stdin.write(command + "\n")
        self.process.stdin.flush()

    def _safe_read_startup_output(self):
        if not self.process or not self.process.stdout:
            return ""

        try:
            return self.process.stdout.read(2000)
        except Exception:
            return ""

    def stop(self):
        with self.lock:
            if self.process and self.process.poll() is None:
                try:
                    self._write_unlocked("q")
                    time.sleep(0.3)
                except Exception:
                    pass

                try:
                    self.process.terminate()
                    self.process.wait(timeout=2)
                except Exception:
                    self.process.kill()


cec = PersistentCECClient()
atexit.register(cec.stop)


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

            output = cec.send(CEC_COMMANDS[command_name])
            self.send_json({"ok": True, "command": command_name, "output": output})

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
    print("Starting persistent cec-client connection...")

    try:
        cec.start()
        print("CEC connection established.")
    except Exception as error:
        print(f"CEC startup warning: {error}")
        print("The web server will still start, but button presses may fail until CEC works.")

    print(f"CEC remote: http://jins-pi.local:{PORT}/dead/experiments/cec-remote/")

    server = ThreadingHTTPServer((HOST, PORT), CECRemoteHandler)
    server.serve_forever()
