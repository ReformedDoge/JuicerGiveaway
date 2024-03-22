try{
let allDataObject = [],tweetUser, myUserInfo;
function createConfetti(options) {
	// Default values for customization
	var defaults = {
		particles: 10,
		spread: 40,
		sizeMin: 3,
		sizeMax: 12,
		eccentricity: 10,
		deviation: 100,
		dxThetaMin: -0.1,
		dxThetaMax: 0.1,
		dyMin: 0.13,
		dyMax: 0.18,
		dThetaMin: 0.4,
		dThetaMax: 0.3
	};

	// Merge options with defaults or use an empty object if options are not provided
    options = Object.assign({}, defaults, options || {});

    // Destructure options for easier access
    var {
        particles,
        spread,
        sizeMin,
        sizeMax,
        eccentricity,
        deviation,
        dxThetaMin,
        dxThetaMax,
        dyMin,
        dyMax,
        dThetaMin,
        dThetaMax
    } = options;

	// Confetti animation logic
	var random = Math.random,
		cos = Math.cos,
		sin = Math.sin,
		PI = Math.PI,
		PI2 = PI * 2,
		timer,
		frame,
		confetti = [];

	function interpolation(a, b, t) {
		return (1 - cos(PI * t)) / 2 * (b - a) + a;
	}

    function color(r, g, b) {
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    var radius = 1/eccentricity, radius2 = radius+radius;
	function createPoisson() {
		// domain is the set of points which are still available to pick from
		// D = union{ [d_i, d_i+1] | i is even }
		var domain = [radius, 1 - radius],
			measure = 1 - radius2,
			spline = [0, 1];
		while (measure) {
			var dart = measure * random(),
				i, l, interval, a, b, c, d;

			// Find where dart lies
			for (i = 0, l = domain.length, measure = 0; i < l; i += 2) {
				a = domain[i], b = domain[i + 1], interval = b - a;
				if (dart < measure + interval) {
					spline.push(dart += a - measure);
					break;
				}
				measure += interval;
			}
			c = dart - radius, d = dart + radius;

			// Update the domain
			for (i = domain.length - 1; i > 0; i -= 2) {
				l = i - 1, a = domain[l], b = domain[i];
				// c---d          c---d  Do nothing
				//   c-----d  c-----d    Move interior
				//   c--------------d    Delete interval
				//         c--d          Split interval
				//       a------b
				if (a >= c && a < d)
					if (b > d) domain[l] = d; // Move interior (Left case)
					else domain.splice(l, 2); // Delete interval
				else if (a < c && b > c)
					if (b <= d) domain[i] = c; // Move interior (Right case)
					else domain.splice(i, 0, c, d); // Split interval
			}

			// Re-measure the domain
			for (i = 0, l = domain.length, measure = 0; i < l; i += 2)
				measure += domain[i + 1] - domain[i];
		}

		return spline.sort();
	}

    // Create the overarching container
    let container = document.createElement('div');
    container.id = "confettiContainer"
    container.style.position = 'fixed';
    container.style.top      = '0';
    container.style.left     = '0';
    container.style.width    = '100%';
    container.style.height   = '0';
    container.style.overflow = 'visible';
    container.style.zIndex   = '9999';


// Function to generate color themes
var colorThemes = generateColorThemes();
// Function to generate color themes
function generateColorThemes() {
	return [
		function() {
			return color(200 * random() | 0, 200 * random() | 0, 200 * random() | 0);
		},
		function() {
			var black = 200 * random() | 0;
			return color(200, black, black);
		},
		function() {
			var black = 200 * random() | 0;
			return color(black, 200, black);
		},
		function() {
			var black = 200 * random() | 0;
			return color(black, black, 200);
		},
		function() {
			return color(200, 100, 200 * random() | 0);
		},
		function() {
			return color(200 * random() | 0, 200, 200);
		},
		function() {
			var black = 256 * random() | 0;
			return color(black, black, black);
		},
		function() {
			return colorThemes[random() < .5 ? 1 : 2]();
		},
		function() {
			return colorThemes[random() < .5 ? 3 : 5]();
		},
		function() {
			return colorThemes[random() < .5 ? 2 : 4]();
		}
	];
}
    // Constructor
	function Confetto(theme) {
		this.frame = 0;
		this.outer = document.createElement('div');
		this.inner = document.createElement('div');
		this.outer.appendChild(this.inner);

		var outerStyle = this.outer.style,
			innerStyle = this.inner.style;
		outerStyle.position = 'absolute';
		outerStyle.width = (sizeMin + sizeMax * random()) + 'px';
		outerStyle.height = (sizeMin + sizeMax * random()) + 'px';
		innerStyle.width = '100%';
		innerStyle.height = '100%';
		innerStyle.backgroundColor = theme();

		outerStyle.perspective = '50px';
		outerStyle.transform = 'rotate(' + (360 * random()) + 'deg)';
		this.axis = 'rotate3D(' +
			cos(360 * random()) + ',' +
			cos(360 * random()) + ',0,';
		this.theta = 360 * random();
		this.dTheta = dThetaMin + dThetaMax * random();
		innerStyle.transform = this.axis + this.theta + 'deg)';

		this.x = window.innerWidth * random();
		this.y = -deviation;
		this.dx = sin(dxThetaMin + dxThetaMax * random());
		this.dy = dyMin + dyMax * random();
		outerStyle.left = this.x + 'px';
		outerStyle.top = this.y + 'px';

		// Create the periodic spline
		this.splineX = createPoisson();
		this.splineY = [];
		for (var i = 1, l = this.splineX.length - 1; i < l; ++i)
			this.splineY[i] = deviation * random();
		this.splineY[0] = this.splineY[l] = deviation * random();

		this.update = function(height, delta) {
			this.frame += delta;
			this.x += this.dx * delta;
			this.y += this.dy * delta;
			this.theta += this.dTheta * delta;

			// Compute spline and convert to polar
			var phi = this.frame % 7777 / 7777,
				i = 0,
				j = 1;
			while (phi >= this.splineX[j]) i = j++;
			var rho = interpolation(
				this.splineY[i],
				this.splineY[j],
				(phi - this.splineX[i]) / (this.splineX[j] - this.splineX[i])
			);
			phi *= PI2;

			outerStyle.left = this.x + rho * cos(phi) + 'px';
			outerStyle.top = this.y + rho * sin(phi) + 'px';
			innerStyle.transform = this.axis + this.theta + 'deg)';
			return this.y > height + deviation;
		};
	}

	function poof() {
		if (!frame) {
			// Append the container
			document.body.appendChild(container);

			// Add confetti
			var theme = colorThemes[0],
				count = 0;
			(function addConfetto() {
				var confetto = new Confetto(theme);
				confetti.push(confetto);
				container.appendChild(confetto.outer);
				timer = setTimeout(addConfetto, spread * random());
			})(0);

			// Start the loop
			var prev = undefined;
			requestAnimationFrame(function loop(timestamp) {
				var delta = prev ? timestamp - prev : 0;
				prev = timestamp;
				var height = window.innerHeight;

				for (var i = confetti.length - 1; i >= 0; --i) {
					if (confetti[i].update(height, delta)) {
						container.removeChild(confetti[i].outer);
						confetti.splice(i, 1);
					}
				}

				if (timer || confetti.length)
					return frame = requestAnimationFrame(loop);

				// Cleanup
				document.body.removeChild(container);
				frame = undefined;
			});
		}
	}

	poof();
};

/* // Example usage:
// Call the function with custom options
createConfetti({
    particles: 20,
    spread: 50,
    sizeMin: 5,
    sizeMax: 15,
    deviation: 150
});

// Call the function without custom options
createConfetti(); */


// This function checks the extension settings and retrieves the audioEnabled value from storage.
const checkSettings = (callback) => {
    // Return the value of audioEnabled from storage
    chrome.storage.sync.get("audioEnabled", (data) => {
        const audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true; // Default to true if not set
        
        // Construct and return the settings object
        const settings = {
            audioEnabled: audioEnabled
        };
        
        // Call the callback function with the settings object
        if (callback && typeof callback === "function") {
            callback(settings);
        }
    });
};

function formatDateStr(date) {
	const e = new Date(date);
	const year = e.getFullYear();
	let month = (e.getMonth() + 1).toString().padStart(2, "0");
	let day = e.getDate().toString().padStart(2, "0");
	let hour = e.getHours().toString().padStart(2, "0");
	let minute = e.getMinutes().toString().padStart(2, "0");
	let second = e.getSeconds().toString().padStart(2, "0");
	return `${year}${month}${day}_${hour}${minute}${second}`;
}

function formatFileName(fileName) {
	const invalidCharsRegex = /[\/?<>\\:*|"]/g;
	const spaceRegex = /\s+/g;
	const maxLength = 255;

	// Replace invalid characters with an empty string
	let formattedFileName = fileName.replace(invalidCharsRegex, "");

	// Replace spaces with underscores
	formattedFileName = formattedFileName.replace(spaceRegex, "_");

	// Ensure the filename does not exceed the maximum length
	formattedFileName = formattedFileName.slice(0, maxLength);

	return formattedFileName;
}


function downloadJSON() {
	if (allDataObject.length > 0) {
		const jsonData = JSON.stringify(allDataObject, null, 2);
		const blob = new Blob([jsonData], {
			type: "application/json;charset=utf-8;"
		});
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.setAttribute("href", url);

		const timestamp = new Date();
		const fileName = formatFileName("Juicers-" + formatDateStr(timestamp) + ".json");
		link.setAttribute("download", fileName);

		link.click();
	}
}

function downloadCSV() {
	// Check if there is data to download
	if (allDataObject.length === 0) {
		console.error("No data available to download.");
		return;
	}

	// Convert data to CSV format using Papa.unparse
	let csvData = Papa.unparse(allDataObject);

	// Add metadata information to the CSV data
	const metadata = `Data from this tweet URL: ${tweetUser.replace("/likes", "")}\n\n`;
	csvData = metadata + csvData;

	// Create a Blob with the CSV data
	const blob = new Blob([csvData], {
		type: "text/csv;charset=utf-8;"
	});

	// Create a download URL for the Blob
	const url = URL.createObjectURL(blob);

	// Create a link element to trigger the download
	const link = document.createElement("a");
	link.setAttribute("href", url);

	// Generate a filename for the downloaded file
	const timestamp = new Date();
	const fileName = formatFileName("Juicers-" + formatDateStr(timestamp) + ".csv");
	link.setAttribute("download", fileName);

	// Trigger the download by clicking the link
	link.click();
}

function init() {
    // Create the main container
    const container = document.createElement("div");
    container.id = "containerForTwExtract";
    container.classList.add("container", "p-5");
    container.style.cssText = `
        z-index: 99999;
        position: fixed;
        top: 10px;
        right: 10px;
        width: 450px;
        height: 260px;
        background-color: #eff5fb;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    `;

    // Create loading text and spinner
    const loadingText = document.createElement("span");
    loadingText.id = "textExport";
    loadingText.textContent = "Counting all the Juicers, please wait";
    loadingText.style.cssText = `
        font-size: 18px;
        font-weight: bold;
    `;
    const spinner = document.createElement("span");
    spinner.id = "loadingExport";
    spinner.classList.add("spinner-border", "spinner-border-sm", "me-2");
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-hidden", "true");
    spinner.style.textAlign = "center";

    // Create container for free user text
    const freeUserContainer = document.createElement("div");
    freeUserContainer.classList.add("row", "justify-content-center");
    freeUserContainer.style.textAlign = "center";
    const freeUserText = document.createElement("span");
    freeUserText.id = "textForFreeUser";
    freeUserText.style.fontSize = "15px";
    freeUserText.style.color = "#6E6C6C";
    freeUserContainer.appendChild(freeUserText);

    // Create button for downloading CSV
    const downloadCSVButton = document.createElement("button");
    downloadCSVButton.id = "btnDownloadCSV";
    downloadCSVButton.classList.add("btn", "btn-outline-primary", "w-100", "fw-bold");
    downloadCSVButton.textContent = "Download CSV";
    downloadCSVButton.addEventListener("click", downloadCSV);
    // Create button for downloading CSV
    const downloadJSONButton = document.createElement("button");
    downloadJSONButton.id = "btnDownloadJSON";
    downloadJSONButton.classList.add("btn", "btn-outline-primary", "w-100", "fw-bold");
    downloadJSONButton.textContent = "Download JSON";
    downloadJSONButton.addEventListener("click", downloadJSON);

    // Create button for stopping export
    const stopExportButton = document.createElement("button");
    stopExportButton.id = "btnStopExport";
    stopExportButton.classList.add("btn", "btn-outline-primary", "w-100", "fw-bold");
    stopExportButton.textContent = "Stop";
    stopExportButton.addEventListener("click", () => {
        if (stopExportButton.textContent === "Close") {
            document.body.removeChild(container);
        } else {
            chrome.runtime.sendMessage({
                type: "stopExport"
            }).then(() => {
                document.body.removeChild(container);
                const overlay = document.getElementById("overlayForTwExtract");
                overlay && overlay.parentNode.removeChild(overlay);
                const textElement = document.getElementById("textElementForTwExtract");
                textElement && textElement.parentNode.removeChild(textElement);
                document.body.style.overflow = "auto";
            });
        }
    });

    // Append elements to the main container
    container.appendChild(loadingText);
    container.appendChild(spinner);
    container.appendChild(freeUserContainer);
    container.appendChild(downloadCSVButton);
    container.appendChild(downloadJSONButton);
    container.appendChild(stopExportButton);

    // Append the main container to the body
    document.body.appendChild(container);

    // Create overlay and text element for TwExtract
    const overlay = document.createElement("div");
    overlay.id = "overlayForTwExtract";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
    `;
    const textElement = document.createElement("div");
    textElement.id = "textElementForTwExtract";
    textElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ffffff;
        font-size: 40px;
        font-weight: bold;
    `;
    textElement.textContent = "Counting Juicers... Hold on!";
    overlay.appendChild(textElement);
    document.body.appendChild(overlay);

    // Prevent scrolling while overlay is active
    document.body.style.overflow = "hidden";
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "startScrape") {
        tweetUser = message.user;
        myUserInfo = message.myUserInfo;
        sendResponse("Service worker running.");
        init();
    } else if (message.type === "updateProgress") {
        let dataLength = message.data.length;
        allDataObject = message.data;
        document.getElementById("btnDownloadCSV").textContent = `Download CSV (${dataLength} Juicers)`;
        document.getElementById("btnDownloadJSON").textContent = `Download JSON (${dataLength} Juicers)`;
    } else if (message.type === "scrapeDone") {
        console.log(message.type)
        let textExport = document.getElementById("textExport");
        textExport.innerHTML = '<span style="color:red">Done !</span>';
        textExport.style.fontWeight = "bold";
        textExport.style.color = "#58EF7F";
        document.getElementById("loadingExport").style.display = "none";
        document.getElementById("btnStopExport").textContent = "Close";
        document.getElementById("overlayForTwExtract");
        let textElementForTwExtract = document.getElementById("textElementForTwExtract");
        if (textElementForTwExtract) {
            textElementForTwExtract.innerHTML = "";
            textElementForTwExtract.insertAdjacentHTML("afterbegin", '<div id="wheelOfFortune">' +
                '<canvas id="wheel" width="800" height="800"></canvas>' +
                '<div id="spin">ASS</div>' +
                '</div>');
            // Function to generate random color
            const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

            const sectors = allDataObject;

            // Generate random float in range min-max:
            const rand = (m, M) => Math.random() * (M - m) + m;

            const tot = sectors.length;
            const elSpin = document.querySelector("#spin");
            const ctx = document.querySelector("#wheel").getContext('2d');
            const dia = ctx.canvas.width;
            const rad = dia / 2;
            const PI = Math.PI;
            const TAU = 2 * PI;
            const arc = TAU / tot;
            const friction = 0.991; // 0.995=soft, 0.99=mid, 0.98=hard
            const angVelMin = 0.002; // Below that number will be treated as a stop
            let angVelMax = 0; // Random ang.vel. to accelerate to 
            let angVel = 0; // Current angular velocity
            let ang = 0; // Angle rotation in radians
            let isSpinning = false;
            let isAccelerating = false;
            let animFrame = null; // Engine's requestAnimationFrame

            // Get index of current sector
            const getIndex = () => Math.floor(tot - ang / TAU * tot) % tot;

            // Draw sectors and prizes texts to canvas
            const drawSector = (sector, i) => {
                const ang = arc * i;
                ctx.save();
                // COLOR
                ctx.beginPath();
                ctx.fillStyle = randomColor(); // Random color
                ctx.moveTo(rad, rad);
                ctx.arc(rad, rad, rad, ang, ang + arc);
                ctx.lineTo(rad, rad);
                ctx.fill();
                // TEXT
                ctx.translate(rad, rad);
                ctx.rotate(ang + arc / 2);
                ctx.textAlign = "center";
                ctx.fillStyle = "#fff";
                ctx.font = "bold 25px sans-serif";
                ctx.fillText(sector.ScreenName, rad - 150, 10);
                //
                ctx.restore();
            };

            // CSS rotate CANVAS Element
            let wheelSpun = false;
            const rotate = () => {
                const sector = sectors[getIndex()];
                ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
                if (!wheelSpun) {
                    elSpin.style.background = randomColor(); // Random color
                    elSpin.textContent = !angVel ? "SPIN" : sector.ScreenName; // Set sector's ScreenName
                    wheelSpun = true;
                } else {
                    elSpin.textContent = sector.ScreenName; // Set sector's ScreenName
                    elSpin.style.textShadow = "3px 3px 6px rgba(0, 0, 0, 0.8), 3px 3px 6px rgba(255, 255, 255, 0.8)"; // Add stronger text shadow for visibility
                    imageUrl = sector.ProfileImageURL.replace("_normal.jpg", "_400x400.jpg");
                    elSpin.style.background = `url(${imageUrl}) no-repeat center`;
                    elSpin.style.backgroundSize = "cover";
                }
                //
            };

            const frame = () => {
                if (!isSpinning) return;

                if (angVel >= angVelMax) isAccelerating = false;

                // Accelerate
                if (isAccelerating) {
                    angVel ||= angVelMin; // Initial velocity kick
                    angVel *= 1.06; // Accelerate
                } else {
                    isAccelerating = false;
                    angVel *= friction; // Decelerate by friction  

                    // SPIN END:
                    if (angVel < angVelMin) {
                        isSpinning = false;
                        angVel = 0;
                        cancelAnimationFrame(animFrame);
                        let textExport = document.getElementById("textExport");
                        textExport.innerHTML = '<span style="color:red">Winner: ' + allDataObject[getIndex()].ScreenName + '</span>';
                        // Render confetti
                        createConfetti();
                        const audio = new Audio(chrome.runtime.getURL("/assets/pogchamp.mp3"));
                        // Play the audio
                        checkSettings((settings) => {
                            if (settings.audioEnabled) audio.play();
                            console.log(settings.audioEnabled);
                        });
                        
                        
                    }
                }

                ang += angVel; // Update angle
                ang %= TAU; // Normalize angle
                rotate(); // CSS rotate!
            };

            const engine = () => {
                frame();
                animFrame = requestAnimationFrame(engine);
            };

            elSpin.addEventListener("click", () => {
                if (isSpinning) return;
                // checking if confettiContainer was already created
                let confettiContainer = document.getElementById("confettiContainer");
                if (confettiContainer) {
                    // If it exists, remove it
                    confettiContainer.parentNode.removeChild(confettiContainer);
                }
                isSpinning = true;
                isAccelerating = true;
                angVelMax = rand(0.25, 0.40);
                engine(); // Start engine!
            });

            // INIT!
            sectors.forEach(drawSector);
            rotate(); // Initial rotation
        }
        console.log(allDataObject)
    }
});
} catch (error) {
    console.error("An error occurred in the content script:", error);
}