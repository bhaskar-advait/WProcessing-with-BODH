/* =====================================================
   WPROCESSING WITH BODH
   CAMERA + MODALS + REWARDS
===================================================== */


/* =====================================================
   MODAL FUNCTIONS
===================================================== */

function openLogin() {
    document.getElementById("loginModal").style.display = "flex";
}


function openScanner() {

    document.getElementById("scannerModal").style.display = "flex";

    startCamera();
}


function openImpact() {
    document.getElementById("impactModal").style.display = "flex";
}


function openVideo() {
    document.getElementById("videoModal").style.display = "flex";
}


function showHubMessage() {
    document.getElementById("hubModal").style.display = "flex";
}


/* =====================================================
   CLOSE MODALS
===================================================== */

function closeModal(id) {

    document.getElementById(id).style.display = "none";

}


function closeCamera() {

    stopCamera();

    document.getElementById("scannerModal").style.display = "none";

}


/* =====================================================
   LIVE CAMERA
===================================================== */

let cameraStream = null;


async function startCamera() {

    const video =
        document.getElementById("cameraVideo");

    const result =
        document.getElementById("scannerResult");

    const canvas =
        document.getElementById("capturedCanvas");

    const retakeButton =
        document.getElementById("retakeButton");


    try {

        /* Stop old camera if already running */

        stopCamera();


        /* Request camera */

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    },
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    }
                },

                audio: false

            });


        video.srcObject = cameraStream;

        video.style.display = "block";

        canvas.style.display = "none";

        retakeButton.style.display = "none";


        result.innerHTML = `

            <h3>📷 Camera Ready</h3>

            <p>
                Position the waste inside the camera frame
                and click <strong>Capture Waste</strong>.
            </p>

        `;

    }

    catch (error) {

        console.error(error);


        result.innerHTML = `

            <h3>⚠️ Camera Access Problem</h3>

            <p>
                Camera could not be opened.
            </p>

            <p>
                Please allow camera permission in your browser.
            </p>

            <p>
                If you opened the website using
                <strong>file://</strong>, run it using
                <strong>http://localhost:8000</strong>.
            </p>

        `;

    }

}


/* =====================================================
   STOP CAMERA
===================================================== */

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(function(track) {

                track.stop();

            });

        cameraStream = null;

    }


    const video =
        document.getElementById("cameraVideo");


    if (video) {

        video.srcObject = null;

    }

}


/* =====================================================
   CAPTURE WASTE PHOTO
===================================================== */

function captureWaste() {

    const video =
        document.getElementById("cameraVideo");

    const canvas =
        document.getElementById("capturedCanvas");

    const result =
        document.getElementById("scannerResult");

    const retakeButton =
        document.getElementById("retakeButton");


    if (!video.videoWidth) {

        result.innerHTML = `

            <h3>⚠️ Camera Not Ready</h3>

            <p>
                Please wait for the camera to start.
            </p>

        `;

        return;

    }


    /* Set canvas size */

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    /* Draw camera image */

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* Show captured image */

    canvas.style.display = "block";

    video.style.display = "none";


    /* Stop camera */

    stopCamera();


    /* Show retake */

    retakeButton.style.display = "inline-block";


    /* Show AI analysis */

    result.innerHTML = `

        <h3>🤖 Analysing Waste...</h3>

        <p>
            AI is examining the captured image.
        </p>

        <div class="loading-bar"></div>

    `;


    /* Simulated AI response */

    setTimeout(function() {

        showWasteResult();

    }, 1500);

}


/* =====================================================
   WASTE RESULT
===================================================== */

function showWasteResult() {

    const result =
        document.getElementById("scannerResult");


    result.innerHTML = `

        <h3>🤖 Waste Identified</h3>

        <div class="result-row">

            <strong>Category</strong>

            <span>Recyclable</span>

        </div>


        <div class="result-row">

            <strong>Condition</strong>

            <span>Needs Verification</span>

        </div>


        <div class="result-row">

            <strong>Recommended Route</strong>

            <span>♻️ Recycling Hub</span>

        </div>


        <div class="result-advice">

            💡 Keep recyclable waste dry and
            separated from wet waste.

        </div>


        <div class="reward-earned">

            🏆 +5 BODH Points Earned!

        </div>

    `;


    /* Add reward */

    addPoints(5);

}


/* =====================================================
   REWARD SYSTEM
===================================================== */

function addPoints(amount) {

    const pointsElement =
        document.getElementById("points");


    if (!pointsElement) {
        return;
    }


    let currentPoints =
        parseInt(pointsElement.innerText) || 0;


    currentPoints += amount;


    pointsElement.innerText =
        currentPoints;

}


/* =====================================================
   LOGIN
===================================================== */

function loginUser() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();


    if (
        username === "" ||
        password === ""
    ) {

        alert(
            "Please enter username and password."
        );

        return;

    }


    alert(
        "Welcome " +
        username +
        "! Your BODH dashboard is ready."
    );


    closeModal("loginModal");

}


/* =====================================================
   CLICK OUTSIDE MODAL
===================================================== */

window.addEventListener(
    "click",
    function(event) {

        const modals =
            document.querySelectorAll(".modal");


        modals.forEach(
            function(modal) {

                if (
                    event.target === modal
                ) {

                    if (
                        modal.id === "scannerModal"
                    ) {

                        closeCamera();

                    } else {

                        modal.style.display =
                            "none";

                    }

                }

            }
        );

    }
);


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeCamera();

            document
                .querySelectorAll(".modal")
                .forEach(
                    function(modal) {

                        modal.style.display =
                            "none";

                    }
                );

        }

    }
);