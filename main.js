import './style.css';

import firebase from './node_modules/firebase/app';
import 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyD7Okt_Owk6QL8LDzjm58JTai_4MyY6lJs",
  authDomain: "p2pwebrtc-6cb31.firebaseapp.com",
  projectId: "p2pwebrtc-6cb31",
  storageBucket: "p2pwebrtc-6cb31.appspot.com",
  messagingSenderId: "480784379302",
  appId: "1:480784379302:web:30db9eaed2345823d73367",
  measurementId: "G-TSXVLR1JEW"
};
  // Initialize Firebase

// firebase.initializeApp(firebaseConfig);

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  //firebase.analytics();
}


const firestore = firebase.firestore();
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};


// Global state 
let pc = new RTCPeerConnection(servers);
// my video stream
let localStream = null;
// friends video stream
let remoteStream = null;

const webcamButton  = document.getElementById('webcamButton');
const webcamVideo  = document.getElementById('webcamVideo');
const callButton  = document.getElementById('callButton');
const callInput  = document.getElementById('callInput');
const answerButton  = document.getElementById('answerButton');
const remoteVideo  = document.getElementById('remoteVideo');
const hangupButton  = document.getElementById('hangupButton');
const muteButton = document.getElementById("muteButton");
const controls = document.getElementById("controls");
let videoOn = true;
let audioOn = true;


muteButton.onclick = async () => {
  (audioOn) ? audioOn = false : audioOn = true;
  localStream =  await navigator.mediaDevices.getUserMedia({video: videoOn, audio: audioOn});
  webcamVideo.srcObject=localStream;
}

webcamButton.onclick = async () => {
  (videoOn) ? videoOn = false : videoOn = true;
  localStream = await navigator.mediaDevices.getUserMedia({video: videoOn, audio: audioOn});
  webcamVideo.srcObject=localStream;

}


// 1. setup media sources

window.onload = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: audioOn});
  remoteStream = new MediaStream();
  // Push audoi and video from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote srteam, add to video
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
};


// 2. create an offer 
callButton.onclick = async () => {
  const callDoc  =  firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates')
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // create offer 
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);


  const offer = {
    sdp: offerDescription.sdp,
    type:offerDescription.type,
  };

  await callDoc.set({offer});


  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer){
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });


  answerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach((change) => {
      if (change.type == 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
}

// 3. Ansewer the call with the unique ID 
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp:answerDescription.sdp,
  };

  await callDoc.update({answer});

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};


hangupButton.onclick = () => {
  pc.close();
  localStream = null;
  remoteStream = null;

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
}