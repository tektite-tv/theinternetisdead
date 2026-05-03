const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const messagesDir = path.join(repoRoot, 'dead', 'messages');
const outputPath = path.join(repoRoot, 'dead', 'JSON', 'message-list.json');

function readMessageFile(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim();
}

function titleFromFilename(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function listMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function formatTime(value) {
  const match = String(value || '').match(/^(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return `${match[1]}:${match[2]}:${match[3]}`;
}

function formatDate(value) {
  const match = String(value || '').match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(year).padStart(4, '0')}-${match[1]}-${match[2]}`;
}

function buildRandomMessages() {
  const randomDir = path.join(messagesDir, 'random_messages');
  return listMarkdownFiles(randomDir).map((filename) => ({
    title: titleFromFilename(filename),
    source: `/dead/messages/random_messages/${filename}`,
    random_message: readMessageFile(path.join(randomDir, filename)),
    message_time: 'random'
  }));
}

function buildStandardMessages() {
  const standardDir = path.join(messagesDir, 'standard_messages');
  return listMarkdownFiles(standardDir).map((filename) => ({
    title: titleFromFilename(filename),
    source: `/dead/messages/standard_messages/${filename}`,
    message: readMessageFile(path.join(standardDir, filename)),
    message_time: 'standard'
  }));
}

function buildTimedMessages() {
  const timedDir = path.join(messagesDir, 'timed_messages');
  return listMarkdownFiles(timedDir).map((filename) => {
    const dailyMatch = filename.match(/^timed-message_(\d{6})\.md$/i);
    const datedMatch = filename.match(/^timed-dated-message_(\d{6})_(\d{8})\.md$/i);
    const time = formatTime((dailyMatch && dailyMatch[1]) || (datedMatch && datedMatch[1]));

    if (!time) {
      console.warn(`Skipping ${filename}: expected timed-message_HHMMSS.md or timed-dated-message_HHMMSS_MMDDYYYY.md.`);
      return null;
    }

    const entry = {
      title: titleFromFilename(filename),
      source: `/dead/messages/timed_messages/${filename}`,
      random_message: readMessageFile(path.join(timedDir, filename)),
      message_time: time
    };

    if (datedMatch) {
      const date = formatDate(datedMatch[2]);
      if (!date) {
        console.warn(`Skipping ${filename}: date should be MMDDYYYY.`);
        return null;
      }
      entry.message_date = date;
    }

    return entry;
  }).filter(Boolean);
}

const defaultPath = path.join(messagesDir, 'default_message.md');
const defaultMessage = fs.existsSync(defaultPath)
  ? readMessageFile(defaultPath)
  : 'Hello World!';

const messageList = {
  default_message: {
    title: 'Default Message',
    source: '/dead/messages/default_message.md',
    message: defaultMessage
  },
  message_groups: [
    {
      title: 'Standard Messages',
      messages: buildStandardMessages()
    },
    {
      title: 'Random Messages',
      random_messages: buildRandomMessages()
    },
    {
      title: 'Timed Messages',
      random_messages: buildTimedMessages()
    }
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(messageList, null, 2)}\n`, 'utf8');

console.log(`Wrote ${path.relative(repoRoot, outputPath)}.`);
