const AVAILABLE_REACTIONS = [
    '👍', '❤️', '🔥', '😂', '🎉', 
    '😮', '😢', '😡', '🚀', '💯', 
    '👏', '🙌', '💩', '👀', '✨'
];

document.addEventListener("DOMContentLoaded", () => {
    const picker = document.getElementById("reaction-picker");
    AVAILABLE_REACTIONS.forEach(emoji => {
        const btn = document.createElement("button");
        btn.innerText = emoji;
        btn.onclick = () => submitReaction(emoji);
        picker.appendChild(btn);
    });
});

function openReactionPicker(msgId) {
    window.state.targetMessageIdForReaction = msgId;
    const picker = document.getElementById("reaction-picker");
    picker.classList.remove("hidden");
}

function closeReactionPicker() {
    window.state.targetMessageIdForReaction = null;
    document.getElementById("reaction-picker").classList.add("hidden");
}

function submitReaction(emoji) {
    if (!window.state.targetMessageIdForReaction) return;
    const msgId = window.state.targetMessageIdForReaction;
    
    const path = window.state.isDM 
        ? `dms/${window.state.currentLocation}/${msgId}/reactions/${emoji}` 
        : `messages/${window.state.currentLocation}/${msgId}/reactions/${emoji}`;

    try {
        const ref = firebase.database().ref(path);
        ref.transaction(count => (count || 0) + 1);
    } catch(e) {}

    closeReactionPicker();
}

function attachDirectReaction(msgId, emoji) {
    const path = window.state.isDM 
        ? `dms/${window.state.currentLocation}/${msgId}/reactions/${emoji}` 
        : `messages/${window.state.currentLocation}/${msgId}/reactions/${emoji}`;

    try {
        const ref = firebase.database().ref(path);
        ref.transaction(count => (count || 0) + 1);
    } catch(e) {}
}

window.updateMessageReactions = function(msgId, reactions) {
    const container = document.getElementById(`reacts-${msgId}`);
    if (!container) return;
    container.innerHTML = "";
    if (!reactions) return;

    Object.keys(reactions).forEach(emoji => {
        const count = reactions[emoji];
        if (count > 0) {
            const pill = document.createElement("span");
            pill.className = "react-pill";
            pill.innerHTML = `<span>${emoji}</span><span>${count}</span>`;
            pill.onclick = () => attachDirectReaction(msgId, emoji);
            container.appendChild(pill);
        }
    });
};
