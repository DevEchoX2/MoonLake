let callTimerInterval = null;
let secondsRemaining = 300;
let localAudioStream = null;

window.startVoiceCall = async function() {
    try {
        localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        document.getElementById("call-banner").classList.remove("hidden");
        secondsRemaining = 300;
        updateCallTimerUI();

        if (callTimerInterval) clearInterval(callTimerInterval);
        
        callTimerInterval = setInterval(() => {
            secondsRemaining--;
            updateCallTimerUI();

            if (secondsRemaining <= 0) {
                window.endVoiceCall();
            }
        }, 1000);
    } catch (err) {}
};

function updateCallTimerUI() {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById("call-timer").innerText = formatted;
}

window.endVoiceCall = function() {
    if (callTimerInterval) clearInterval(callTimerInterval);
    if (localAudioStream) {
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudioStream = null;
    }
    document.getElementById("call-banner").classList.add("hidden");
    secondsRemaining = 300;
    updateCallTimerUI();
};
