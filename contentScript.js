(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";

      youtubeLeftControls =
        document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName("video-stream")[0];

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkHandler);
    }
  };

  const addNewBookmarkHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: `Bookmark at ${getTime(currentTime)}`,
    };

    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
      ),
    });
  };

  const renameSelectedBookmark = async function (value, desc, response) {
    const newBookmark = {
      time: value,
      desc: desc,
    };
    currentVideoBookmarks = await fetchBookmarks();
    currentVideoBookmarks = currentVideoBookmarks.filter(
      (b) => b.time != value
    );
    currentVideoBookmarks = [...currentVideoBookmarks, newBookmark];
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        currentVideoBookmarks.sort((a, b) => a.time - b.time)
      ),
    });
    response(currentVideoBookmarks);
  };

  const removeSelectedBookmark = async function (value, response) {
    currentVideoBookmarks = await fetchBookmarks();
    currentVideoBookmarks = currentVideoBookmarks.filter(
      (b) => b.time != value
    );
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
    });
    response(currentVideoBookmarks);
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId, desc } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {
      removeSelectedBookmark(value, response);
      return true;
    } else if (type === "RENAME") {
      renameSelectedBookmark(value, desc, response);
      return true;
    }
  });
  newVideoLoaded();
})();

const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substring(11, 19);
};
