const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

window.state = {
    activeTab: "channels",
    currentLocation: "general",
    isDM: false,
    replyContext: null,
    targetMessageIdForReaction: null,
    user: null
};

document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            window.state.user = {
                uid: user.uid,
                name: user.displayName || "User_" + user.uid.substring(0, 5),
                avatar: user.photoURL || "default.png"
            };
            document.getElementById("account-name").innerText = window.state.user.name;
            document.getElementById("account-avatar").src = window.state.user.avatar;
            switchTab("channels");
            initPresence();
            loadMessages();
        } else {
            auth.signInAnonymously();
        }
    });
});

function switchTab(tabName) {
    const tabs = ["channels", "dms", "friends"];
    tabs.forEach(t => {
        document.getElementById(`btn-tab-${t}`).classList.remove("active");
        document.getElementById(`panel-${t}`).classList.add("hidden");
    });
    
    document.getElementById(`btn-tab-${tabName}`).classList.add("active");
    document.getElementById(`panel-${tabName}`).classList.remove("hidden");
    window.state.activeTab = tabName;
}

function switchLocation(type, id, displayName = null) {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".dm-item").forEach(el => el.classList.remove("active"));

    if (type === 'channels') {
        window.state.isDM = false;
        window.state.currentLocation = id;
        document.getElementById("header-icon").className = "fa-solid fa-hashtag";
        document.getElementById("header-name").innerText = id;
        const activeItem = document.querySelector(`.nav-item[data-channel="${id}"]`);
        if(activeItem) activeItem.classList.add("active");
    } else if (type === 'dms') {
        window.state.isDM = true;
        window.state.currentLocation = id;
        document.getElementById("header-icon").className = "fa-solid fa-at";
        document.getElementById("header-name").innerText = displayName || id;
    }
    loadMessages();
}

function initPresence() {
    const statusRef = db.ref(`/status/${window.state.user.uid}`);
    const onlineState = { state: "online", ...window.state.user };
    const offlineState = { state: "offline", ...window.state.user };

    db.ref(".info/connected").on("value", (snap) => {
        if (snap.val() === false) return;
        statusRef.onDisconnect().set(offlineState).then(() => {
            statusRef.set(onlineState);
        });
    });

    db.ref("/status").on("value", (snap) => {
        const onGroup = document.getElementById("group-online");
        const offGroup = document.getElementById("group-offline");
        onGroup.innerHTML = "";
        offGroup.innerHTML = "";
        let onCnt = 0, offCnt = 0;

        snap.forEach(child => {
            const u = child.val();
            const el = document.createElement("div");
            el.className = "member-row";
            el.innerHTML = `<img src="${u.avatar || 'default.png'}"><span>${u.name}</span>`;
            el.onclick = () => openUserModal(u.uid, u.name, u.avatar);

            if (u.state === "online") {
                onGroup.appendChild(el);
                onCnt++;
            } else {
                offGroup.appendChild(el);
                offCnt++;
            }
        });

        document.getElementById("cnt-online").innerText = onCnt;
        document.getElementById("cnt-offline").innerText = offCnt;
    });
}

function loadMessages() {
    const viewport = document.getElementById("messages-viewport");
    viewport.innerHTML = "";
    
    const path = window.state.isDM 
        ? `dms/${window.state.currentLocation}` 
        : `messages/${window.state.currentLocation}`;

    db.ref(path).off();
    
    db.ref(path).on("child_added", (snap) => {
        renderMessage(snap.key, snap.val());
    });
    
    db.ref(path).on("child_changed", (snap) => {
        if(window.updateMessageReactions) {
            window.updateMessageReactions(snap.key, snap.val().reactions);
        }
    });
    
    db.ref(path).on("child_removed", (snap) => {
        const msgElement = document.getElementById(`msg-${snap.key}`);
        if (msgElement) msgElement.remove();
    });
}

function renderMessage(id, msg) {
    const viewport = document.getElementById("messages-viewport");
    const row = document.createElement("div");
    row.className = "msg-row";
    row.id = `msg-${id}`;

    const timestamp = msg.timestamp || Date.now();
    const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let quoteHtml = "";
    if (msg.replyTo) {
        quoteHtml = `<div class="msg-quote"><b>@${msg.replyTo.user}</b>: ${msg.replyTo.text}</div>`;
    }

    row.innerHTML = `
        <img src="${msg.avatar || 'default.png'}" class="msg-avatar" onclick="openUserModal('${msg.uid}', '${msg.name}', '${msg.avatar}')">
        <div class="msg-body">
            <div class="msg-meta">
                <span class="msg-author" onclick="openUserModal('${msg.uid}', '${msg.name}', '${msg.avatar}')">${msg.name}</span>
                <span class="msg-time">${formattedTime}</span>
            </div>
            ${quoteHtml}
            <div class="msg-text">${msg.text}</div>
            <div class="reactions-list" id="reacts-${id}"></div>
            <div class="msg-actions">
                <button class="action-btn" onclick="openReactionPicker('${id}')"><i class="fa-solid fa-face-smile"></i></button>
                <button class="action-btn" onclick="triggerReply('${id}', '${msg.name}', '${msg.text}')"><i class="fa-solid fa-reply"></i></button>
                <button class="action-btn" style="color: #ff5555; border-color: #ff555544;" onclick="deleteMessage('${id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;

    viewport.appendChild(row);
    if (msg.reactions && window.updateMessageReactions) {
        window.updateMessageReactions(id, msg.reactions);
    }
    viewport.scrollTop = viewport.scrollHeight;
}

window.deleteMessage = function(id) {
    const path = window.state.isDM 
        ? `dms/${window.state.currentLocation}/${id}` 
        : `messages/${window.state.currentLocation}/${id}`;
    
    db.ref(path).remove();
}

function handleInputKeypress(e) {
    if (e.key === "Enter") sendMessage();
}

function sendMessage() {
    const input = document.getElementById("chat-input");
    const val = input.value.trim();
    if (!val || !window.state.user) return;

    const path = window.state.isDM 
        ? `dms/${window.state.currentLocation}` 
        : `messages/${window.state.currentLocation}`;

    const payload = {
        uid: window.state.user.uid,
        name: window.state.user.name,
        avatar: window.state.user.avatar,
        text: val,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    if (window.state.replyContext) {
        payload.replyTo = window.state.replyContext;
        if(window.clearReply) window.clearReply();
    }

    db.ref(path).push(payload);
    input.value = "";
}

function openUserModal(uid, name, avatar) {
    document.getElementById("modal-avatar").src = avatar || 'default.png';
    document.getElementById("modal-username").innerText = name;
    document.getElementById("modal-uid").innerText = uid;
    
    document.getElementById("btn-action-dm").onclick = () => {
        if(window.startDirectMessage) window.startDirectMessage(uid, name, avatar);
        closeUserModal();
    };

    document.getElementById("btn-action-friend").onclick = () => {
        if(window.addFriend) window.addFriend(uid, name, avatar);
        closeUserModal();
    };

    document.getElementById("user-modal").classList.remove("hidden");
}

function closeUserModal() {
    document.getElementById("user-modal").classList.add("hidden");
}
