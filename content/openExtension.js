var openDynamicPostsButton = "<button id='dynamicPostsButton'>My Top40 List</button>";
$('body').append(openDynamicPostsButton);
$('#dynamicPostsButton').click(function(){
  chrome.runtime.sendMessage({
    type: 'openDynamicPosts',
    replaceTab: true,
    params: window.location.search
  });
});

$('#dynamicPostsButton').click();
