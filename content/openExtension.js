chrome.runtime.sendMessage({
  type: 'openDynamicPosts',
  replaceTab: true,
  params: window.location.search
});
