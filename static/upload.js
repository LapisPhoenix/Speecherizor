// DOM Element Selectors
const uploadArea = document.getElementById("upload-area");
const nextButton = document.getElementById("next");
const fileInput = document.getElementById("file-input");
const loadingDiv = document.getElementById("loading");
const submitDiv = document.getElementById("submit");
const resultsDiv = document.getElementById("results");
const timeDiv = document.getElementById("time");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");

// Drag and Drop Event Handlers
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.style.backgroundColor = "#f0f8ff";
}

function handleDragLeave() {
    uploadArea.style.backgroundColor = "";
}

function handleDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;

    if (files.length > 1) {
        alert("Please upload only one audio file.");
        return;
    }

    const file = files[0];
    if (file && file.type.startsWith("audio/")) {
        processFileUpload(file);
    } else {
        alert("Please upload a valid audio file.");
    }
}

// File Input Event Handlers
function handleFileInputChange(event) {
    const files = event.target.files;

    if (!files || files.length !== 1) {
        alert(files ? "Too many files! Only 1 is allowed at a time." : "Please provide an audio file!");
        event.target.value = '';
        return;
    }

    const file = files[0];
    if (!file.type.startsWith("audio/")) {
        alert("Please upload a valid audio file.");
        event.target.value = '';
        return;
    }

    toggleNextStep(file);
}

// File Upload and Processing
function processFileUpload(file) {
    const formData = new FormData();
    formData.append("audio", file);

    return fetch("/process_audio", {
        method: "POST",
        body: formData,
    })
    .then((response) => response.json())
    .then((result) => {
        if (result.error) {
            console.error("Error:", result.error);
            return null;
        }
        return result.wpm || null;
    })
    .catch((error) => {
        console.error("Error uploading file:", error);
        return null;
    });
}

// Next Step Toggle
function toggleNextStep(file) {
    // Handle time input validation
    if (!timeDiv.classList.contains("hidden") && file === null) {
        const hours = hoursInput.value;
        const minutes = minutesInput.value;
        const seconds = secondsInput.value;

        if (hours === "0" && minutes === "0" && seconds === "0") {
            alert("Please specify a length greater than 0 seconds.");
            return;
        }

        timeDiv.classList.add("hidden");
        submitDiv.classList.remove("hidden");
        return;
    }

    // Prepare for file processing
    loadingDiv.classList.remove("hidden");
    loadingDiv.classList.add("show");
    submitDiv.classList.add("hidden");
    resultsDiv.classList.add("hidden");

    processFileUpload(file)
        .then((wpm) => {
            loadingDiv.classList.remove("show");
            loadingDiv.classList.add("hidden");
            calculateSpeechDetails(wpm);
        })
        .catch((error) => {
            loadingDiv.classList.remove("show");
            loadingDiv.classList.add("hidden");
            submitDiv.classList.remove("hidden");
            console.error("Error during upload:", error);
            alert("An error occurred. Please try again.");
        });
}

// Calculate Speech Details
function calculateSpeechDetails(wpm) {
    if (!wpm) {
        resultsDiv.innerHTML = `<h2>Error: Could not process the audio.</h2>`;
        resultsDiv.classList.remove("hidden");
        return;
    }

    let hours = hoursInput.value;
    let minutes = minutesInput.value;
    const seconds = secondsInput.value;

    // Default to 5 minutes if no time specified
    if (hours === "0" && minutes === "0" && seconds === "0") {
        minutes = "5";
    }

    const formData = new FormData();
    formData.append("wpm", wpm);
    formData.append("hours", hours);
    formData.append("minutes", minutes);
    formData.append("seconds", seconds);

    fetch("/calculate", {
        method: "POST",
        body: formData,
    })
    .then((response) => response.json())
    .then((result) => {
        if (result.error) {
            resultsDiv.innerHTML = `<h2>Error: ${result.error}</h2>`;
        } else if (result.word_count) {
            resultsDiv.innerHTML = formatFinalResult(result, hours, minutes, seconds);
        }
        resultsDiv.classList.remove("hidden");
    })
    .catch((error) => {
        loadingDiv.classList.add("hidden");
        submitDiv.classList.remove("hidden");
        console.error("Error during calculation:", error);
        alert("An error occurred while calculating. Please try again.");
    });
}

// Format Final Result
function formatFinalResult(result, hours, minutes, seconds) {
    let finalHTML = `<h2>You need around <span class="rainbow">${result.word_count}</span> words for a `;

    const timeParts = [];
    if (hours > 0) timeParts.push(`<span class="rainbow">${hours}</span> hour`);
    if (minutes > 0) timeParts.push(`<span class="rainbow">${minutes}</span> minute`);
    if (seconds > 0) timeParts.push(`<span class="rainbow">${seconds}</span> second`);

    finalHTML += timeParts.join(", ") + ` speech at <span class="rainbow">${Math.round(result.wpm)}</span> words per minute.</h2>`;

    return finalHTML;
}

// Validate Time Input
function handleTimeInputChange() {
    const hours = hoursInput.value;
    const minutes = minutesInput.value;
    const seconds = secondsInput.value;

    if (hours === "0" && minutes === "0" && seconds === "0") {
        alert("Please specify a length greater than 0 seconds.");
    }
}

// Event Listeners
uploadArea.addEventListener("dragover", handleDragOver);
uploadArea.addEventListener("dragleave", handleDragLeave);
uploadArea.addEventListener("drop", handleDrop);
uploadArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", handleFileInputChange);

hoursInput.addEventListener("input", handleTimeInputChange);
minutesInput.addEventListener("input", handleTimeInputChange);
secondsInput.addEventListener("input", handleTimeInputChange);

nextButton.addEventListener("click", () => toggleNextStep(null));