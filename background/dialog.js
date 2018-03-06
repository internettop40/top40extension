var browser = browser == null ? chrome : browser;

document.forms[0].onsubmit = function(e) {
    e.preventDefault(); // Prevent submission
    var email_or_id = document.getElementById('email_or_id').value;
    browser.runtime.getBackgroundPage(function(bgWindow) {
        bgWindow.setEmailOrId(email_or_id);
        window.close();     // Close dialog
    });
};
