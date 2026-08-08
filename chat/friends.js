window.addFriend = function(targetUid, targetName, targetAvatar) {
    try {
        firebase.database().ref(`friends/${window.state.user.uid}/${targetUid}`).set({
            uid: targetUid,
            name: targetName,
            avatar: targetAvatar || "default.png",
            addedAt: Date.now()
        });
    } catch(e) {}
};

function listenFriends() {
    const container = document.getElementById("friends-list-container");
    try {
        firebase.database().ref(`friends/${window.state.user.uid}`).on("value", (snap) => {
            container.innerHTML = "";
            snap.forEach(child => {
                const f = child.val();
                const el = document.createElement("div");
                el.className = "friend-item";
                el.innerHTML = `<img src="${f.avatar}" style="width:24px;height:24px;border-radius:50%;"> ${f.name}`;
                el.onclick = () => window.openUserModal(f.uid, f.name, f.avatar);
                container.appendChild(el);
            });
        });
    } catch(e) {}
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(listenFriends, 1000);
});
