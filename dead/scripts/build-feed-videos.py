#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHANNELS_PATH = ROOT / "dead" / "JSON" / "feeds-channels.json"
OUTPUT_PATH = ROOT / "dead" / "JSON" / "feed-videos.json"
LEGACY_FALLBACK_PATH = ROOT / "dead" / "JSON" / "videos.json"
LOCAL_COOKIES_PATH = ROOT / "cookies.txt"


def load_channels_config():
    data = json.loads(CHANNELS_PATH.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        title = str(data.get("title") or "Channel Feed").strip() or "Channel Feed"
        raw_channels = data.get("channels") or []
    elif isinstance(data, list):
        title = "Channel Feed"
        raw_channels = data
    else:
        raise ValueError("channels.json must be an object or array")

    channels = []
    seen_urls = set()
    for item in raw_channels:
        if isinstance(item, str):
            url = item.strip()
        elif isinstance(item, dict):
            url = str(item.get("url") or item.get("channel_url") or "").strip()
        else:
            continue

        if not url:
            continue

        normalized_url = normalize_channel_url(url)
        if normalized_url in seen_urls:
            continue

        channels.append({"url": normalized_url})
        seen_urls.add(normalized_url)

    if not channels:
        raise ValueError("channels.json does not contain any valid channel URLs")

    return {"title": title, "channels": channels}


def normalize_channel_url(url):
    value = str(url or "").strip()
    if not value:
        return value
    if value.startswith("@"):
        return f"https://www.youtube.com/{value}/videos"
    if value.startswith("http://"):
        value = "https://" + value[len("http://") :]
    if not value.startswith("https://"):
        raise ValueError(f"Unsupported channel URL: {url}")
    if value.rstrip("/").endswith("/videos"):
        return value.rstrip("/")
    return value.rstrip("/") + "/videos"


def run_yt_dlp_json(url):
    base_command = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--ignore-errors",
        "--no-warnings",
        "--extractor-args",
        "youtube:approximate_date",
        "-J",
        url,
    ]
    cookies_path = get_cookies_path()
    attempts = [cookies_path] if cookies_path else [None]
    if cookies_path:
        attempts.append(None)

    last_error = ""
    for attempt_cookies_path in attempts:
        command = list(base_command)
        using_cookies = attempt_cookies_path is not None
        if using_cookies:
            command[3:3] = ["--cookies", str(attempt_cookies_path)]

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,
        )
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        parsed_data = None
        if stdout:
            try:
                parsed_data = json.loads(stdout)
            except json.JSONDecodeError:
                parsed_data = None

        if using_cookies and "The page needs to be reloaded" in stderr:
            last_error = stderr or f"yt-dlp returned no JSON for {url}"
            print(f"Warning: cookie-backed fetch failed for {url}; retrying without cookies.", file=sys.stderr)
            continue

        if parsed_data is not None:
            if stderr:
                print(stderr, file=sys.stderr)
            return parsed_data

        last_error = stderr or f"yt-dlp returned no JSON for {url}"
        if using_cookies:
            print(f"Warning: cookie-backed fetch failed for {url}; retrying without cookies.", file=sys.stderr)
            continue

    raise RuntimeError(last_error or f"yt-dlp returned no JSON for {url}")


def get_cookies_path():
    env_path = str(os.environ.get("YT_DLP_COOKIES_PATH") or "").strip()
    if env_path:
        candidate = Path(env_path).expanduser()
        if candidate.exists():
            return candidate
        print(f"Warning: cookie file not found at {candidate}", file=sys.stderr)

    if LOCAL_COOKIES_PATH.exists():
        return LOCAL_COOKIES_PATH

    return None


def build_watch_url(video):
    direct_url = str(video.get("url") or "").strip()
    if direct_url:
        return direct_url

    video_id = str(video.get("id") or "").strip()
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"

    return ""


def get_sort_timestamp(video):
    for key in ("release_timestamp", "timestamp"):
        value = video.get(key)
        if isinstance(value, (int, float)):
            return int(value)

    upload_date = str(video.get("upload_date") or "").strip()
    if len(upload_date) == 8 and upload_date.isdigit():
        year = int(upload_date[0:4])
        month = int(upload_date[4:6])
        day = int(upload_date[6:8])
        return int(datetime(year, month, day, tzinfo=timezone.utc).timestamp())

    return 0


def slim_thumbnails(video):
    thumbnails = video.get("thumbnails") or []
    slimmed = []
    for thumb in thumbnails:
        if not isinstance(thumb, dict):
            continue
        url = thumb.get("url")
        if not url:
            continue
        slimmed.append(
            {
                "url": url,
                "width": thumb.get("width"),
                "height": thumb.get("height"),
            }
        )
    return slimmed


def has_meaningful_text(value):
    return bool(str(value or "").strip())


def video_needs_hydration(video):
    if not isinstance(video, dict):
        return False

    has_timestamp = get_sort_timestamp(video) > 0
    has_thumbnails = bool(slim_thumbnails(video))
    return not (has_timestamp and has_thumbnails)


def merge_video_data(base_video, hydrated_video):
    if not isinstance(base_video, dict):
        return hydrated_video if isinstance(hydrated_video, dict) else {}
    if not isinstance(hydrated_video, dict):
        return dict(base_video)

    merged = dict(base_video)
    for key, value in hydrated_video.items():
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, (list, dict)) and not value:
            continue
        merged[key] = value
    return merged


def hydrate_video_entry(video):
    if not video_needs_hydration(video):
        return video

    watch_url = build_watch_url(video)
    if not watch_url:
        return video

    try:
        hydrated_video = run_yt_dlp_json(watch_url)
    except Exception as exc:  # noqa: BLE001 - preserve feed generation from partial data.
        print(f"Warning: failed to hydrate {watch_url}: {exc}", file=sys.stderr)
        return video

    return merge_video_data(video, hydrated_video)


def slim_video(video, channel_meta):
    return {
        "id": video.get("id"),
        "title": video.get("title") or "",
        "description": video.get("description") or "",
        "duration": video.get("duration") or 0,
        "view_count": video.get("view_count") or 0,
        "channel": video.get("channel") or channel_meta.get("channel") or channel_meta.get("uploader") or "",
        "channel_id": video.get("channel_id") or channel_meta.get("channel_id"),
        "channel_url": video.get("channel_url") or channel_meta.get("channel_url"),
        "uploader": video.get("uploader") or channel_meta.get("uploader") or channel_meta.get("channel") or "",
        "uploader_url": video.get("uploader_url") or channel_meta.get("uploader_url"),
        "timestamp": video.get("timestamp"),
        "release_timestamp": video.get("release_timestamp"),
        "upload_date": video.get("upload_date"),
        "thumbnails": slim_thumbnails(video),
    }


def load_legacy_fallback_feed():
    if not LEGACY_FALLBACK_PATH.exists():
        return {"channels": [], "entries": []}

    data = json.loads(LEGACY_FALLBACK_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {"channels": [], "entries": []}

    channel_meta = {
        "url": data.get("webpage_url") or data.get("original_url") or data.get("channel_url") or data.get("uploader_url") or "",
        "channel": data.get("channel") or data.get("uploader") or "",
        "channel_id": data.get("channel_id") or data.get("id"),
        "channel_url": data.get("channel_url") or data.get("uploader_url") or "",
        "uploader": data.get("uploader") or data.get("channel") or "",
        "uploader_url": data.get("uploader_url") or data.get("channel_url") or "",
    }

    entries = []
    seen_video_ids = set()
    for entry in data.get("entries") or []:
        if not isinstance(entry, dict):
            continue
        video_id = str(entry.get("id") or "").strip()
        if not video_id or video_id in seen_video_ids:
            continue
        seen_video_ids.add(video_id)
        entries.append(slim_video(entry, channel_meta))

    entries.sort(
        key=lambda video: (get_sort_timestamp(video), str(video.get("id") or "")),
        reverse=True,
    )

    channels = [channel_meta] if any(channel_meta.values()) else []
    return {"channels": channels, "entries": entries}


def main():
    config = load_channels_config()
    discovered_channels = []
    merged_entries = []
    seen_video_ids = set()

    for channel_config in config["channels"]:
        channel_url = channel_config["url"]
        try:
            channel_data = run_yt_dlp_json(channel_url)
        except Exception as exc:  # noqa: BLE001 - keep building from remaining sources.
            print(f"Warning: failed to load {channel_url}: {exc}", file=sys.stderr)
            continue
        if not isinstance(channel_data, dict):
            print(f"Warning: unable to read channel feed for {channel_url}", file=sys.stderr)
            continue

        channel_meta = {
            "url": channel_url,
            "channel": channel_data.get("channel") or channel_data.get("uploader") or "",
            "channel_id": channel_data.get("channel_id") or channel_data.get("id"),
            "channel_url": channel_data.get("channel_url") or channel_url,
            "uploader": channel_data.get("uploader") or channel_data.get("channel") or "",
            "uploader_url": channel_data.get("uploader_url") or channel_data.get("channel_url") or channel_url,
        }
        discovered_channels.append(channel_meta)

        for entry in channel_data.get("entries") or []:
            if not isinstance(entry, dict):
                continue
            video_id = str(entry.get("id") or "").strip()
            if not video_id or video_id in seen_video_ids:
                continue
            seen_video_ids.add(video_id)
            merged_entries.append(slim_video(hydrate_video_entry(entry), channel_meta))

    if not merged_entries:
        fallback_feed = load_legacy_fallback_feed()
        if fallback_feed["entries"]:
            merged_entries = fallback_feed["entries"]
            if not discovered_channels:
                discovered_channels = fallback_feed["channels"]

    merged_entries.sort(
        key=lambda video: (get_sort_timestamp(video), str(video.get("id") or "")),
        reverse=True,
    )

    payload = {
        "title": config["title"],
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "channels": discovered_channels,
        "entries": merged_entries,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
