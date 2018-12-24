console.log('Fuse is imported: ', Fuse);

const KEY_TITLE = "title",
  KEY_URL = "url";

// configure fuzzy search engine - better to read source code(index.js specifically) to figure out
// the meaning of each attribute
var options = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.8,
  location: 0,
  distance: 150,
  maxPatternLength: 64,
  minMatchCharLength: 1,
  keys: [
    KEY_TITLE,
    KEY_URL,
  ],
  id: KEY_URL,
};

// change the underlying list via f.list = newList
var savedTabs = {
  "https://google.com": "Google",
  "htps://amazon.com": "Amazon",
  "https://baidu.com": "Baidu",
  "https://news.ycombinator.com/": "Hacker News",
};

var fuse = new Fuse(Object.entries(savedTabs).map(([url, title]) => {
  return {
    [KEY_URL]: url,
    [KEY_TITLE]: title,
  }
}), options);

function log(logStr, ...items) {
  console.log(logStr, ...items);
}

log('Background script loaded')
