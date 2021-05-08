const webcamButton  = document.getElementById('webcamButton');
const webcamVideo  = document.getElementById('webcamVideo');
const callButton  = document.getElementById('callButton');
const callInput  = document.getElementById('callInput');
const answerButton  = document.getElementById('answerButton');
const remoteVideo  = document.getElementById('remoteVideo');
const hangupButton  = document.getElementById('hangupButton');
const muteButton = document.getElementById("muteButton");
const controls = document.getElementById("controls")




webcamButton.onclick = () => {
    toggleBtnColor()
};

hangupButton.onclick = () => {};

muteButton.onclick = () => {};

controls.onclick = () => {
    const x = document.getElementById("controlsBox");
    let a = document.getElementsByClassName("fa-phone-volume");
    let b = document.getElementsByClassName("fa-bars");
  
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  
    flipColor(a);
    flipColor(b);

};

function toggleBtnColor() {
    if (a.style.color === "white")
    a.style.color = "black";
  else if (a.style.color === "black")
    a.style.color = "white";

};

