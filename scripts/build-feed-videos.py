#!/usr/bin/env python3
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHANNELS_PATH = ROOT / "pages" / "feeds" / "channels.json"
OUTPUT_PATH = ROOT / "pages" / "feeds" / "feed-videos.json"


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
    command = [
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
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    stdout = result.stdout.strip()
    if not stdout:
        stderr = result.stderr.strip()
        raise RuntimeError(stderr or f"yt-dlp returned no JSON for {url}")
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    return json.loads(stdout)


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


def main():
    config = load_channels_config()
    discovered_channels = []
    merged_entries = []
    seen_video_ids = set()

    for channel_config in config["channels"]:
        channel_url = channel_config["url"]
        channel_data = run_yt_dlp_json(channel_url)
        if not isinstance(channel_data, dict):
            raise RuntimeError(f"Unable to read channel feed for {channel_url}")

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
            merged_entries.append(slim_video(entry, channel_meta))

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
