window.triggerReply = function(msgId, username, text) {
    window.state.replyContext = {
        id: msgId,
        user: username,
        text: text
    };
    document.getElementById("reply-target-user").innerText = `@${username}`;
    document.getElementById("reply-preview-bar").classList.remove("hidden");
    document.getElementById("chat-input").focus();
};

window.clearReply = function() {
    window.state.replyContext = null;
    document.getElementById("reply-preview-bar").classList.add("hidden");
};
