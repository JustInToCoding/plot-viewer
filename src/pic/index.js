import React, { PureComponent } from "react";
import adapter from "webrtc-adapter";
import "./styles.css";

export class Pic extends PureComponent {
  width = 640; // We will scale the photo width to this
  height = 0; // This will be computed based on the input stream

  streaming = false;

  video = null;
  canvas = null;
  photo = null;
  startbutton = null;
  startrecording = null;

  constructor() {
    super();
    // this.video = React.createRef();
    this.canvas = React.createRef();
    this.photo = React.createRef();
    this.startbutton = React.createRef();
    this.startrecording = React.createRef();

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        // First get ahold of the legacy getUserMedia, if present
        var getUserMedia =
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(
            new Error("getUserMedia is not implemented in this browser")
          );
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  }

  paintVideo = () => {
    if (this.canvas.current) {
      this.canvas.current
        .getContext("2d")
        .drawImage(
          this.video.current,
          0,
          0,
          this.canvas.current.width,
          this.canvas.current.height
        );
      if (!this.video.current.paused) requestAnimationFrame(this.paintVideo);
    }
  };

  useCamera = () => {
    const video = this.video.current;
    video.muted = true;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
  };

  componentDidMount() {
    this.video = { current: document.createElement("video") };
    const video = this.video.current;
    video.muted = true;
    video.playsinline = true;
    video["webkit-playsinline"] = true;
    video.addEventListener("playing", this.paintVideo);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        // Older browsers may not have srcObject
        if ("srcObject" in video) {
          video.srcObject = stream;
        } else {
          // Avoid using this in new browsers, as it is going away.
          video.src = window.URL.createObjectURL(stream);
        }
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        video.play();
      })
      .catch(err => {
        console.log("An error occurred: " + err);
      });

    // video.onloadedmetadata = e => {
    //   video.play();
    // };

    // this.video.current.addEventListener(
    //   "canplay",
    //   ev => {
    //     if (!this.streaming) {
    //       this.height =
    //         this.video.current.videoHeight /
    //         (this.video.current.videoWidth / this.width);

    //       this.video.current.setAttribute("width", this.width);
    //       this.video.current.setAttribute("height", this.height);
    //       this.canvas.current.setAttribute("width", this.width);
    //       this.canvas.current.setAttribute("height", this.height);
    //       this.streaming = true;
    //     }
    //   },
    //   false
    // );

    this.startbutton.current.addEventListener(
      "click",
      ev => {
        this.takepicture();
        ev.preventDefault();
      },
      false
    );

    // this.startrecording.current.addEventListener(
    //   "click",
    //   this.useCamera,
    //   false
    // );
  }

  takepicture() {
    var data = this.canvas.current.toDataURL("image/png");
    this.photo.current.setAttribute("src", data);
  }

  render() {
    return (
      <div>
        <input type="file" accept="image/*" capture="camera"></input>
        <div className="camera">
          <button onclick="this.useCamera()">Start recording</button>
          {/* <video
            className="video either-gif-or-video"
            ref={this.video}
            muted
            autoplay
            playsinline
            webkit-playsinline
          >
            Video stream not available.
          </video> */}
          <button className="startbutton" ref={this.startbutton}>
            Take photo
          </button>
        </div>
        <canvas className="canvas" ref={this.canvas}></canvas>
        <div className="output">
          <img
            className="photo"
            ref={this.photo}
            alt="The screen capture will appear in this box."
          />
        </div>
      </div>
    );
  }
}
