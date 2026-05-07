const fs = require('fs');

let content = fs.readFileSync('frontend/public/tv.html', 'utf8');

// 1. In renderScreen, make videos lazy load by using data-src
content = content.replace(
    "vid.src = items[s].url;",
    "vid.dataset.src = items[s].url; if(s === 0 || s === 1 || s === items.length - 1) { vid.src = items[s].url; }"
);

// 2. In nextSlide, manage the sliding window of video srcs
const nextSlidePatch = `
                currentSlide = (currentSlide + 1) % allSlides.length;

                // --- SLIDING WINDOW OPTIMIZATION FOR SMART TV RAM ---
                // Preload the next video in the queue
                var nextNextIndex = (currentSlide + 1) % allSlides.length;
                var nextNextSlide = document.getElementById('slide-' + nextNextIndex);
                if (nextNextSlide) {
                    var nextNextVid = nextNextSlide.querySelector('video');
                    if (nextNextVid && !nextNextVid.src) {
                        nextNextVid.src = nextNextVid.dataset.src;
                        nextNextVid.load();
                    }
                }
                
                // Flush the old video from RAM after it fades out (1.5s)
                setTimeout(function() {
                    if (oldSlide) {
                        var oldVid = oldSlide.querySelector('video');
                        if (oldVid) {
                            oldVid.pause();
                            // If it's not the current or next slide, flush its memory
                            var keepPreloaded = (allSlides.length <= 3); // don't flush if tiny playlist
                            if (!keepPreloaded) {
                                oldVid.removeAttribute('src');
                                oldVid.load(); // Forces TV decoder to drop memory
                            }
                        }
                    }
                }, 1500);
                // ----------------------------------------------------

                var newSlide = document.getElementById('slide-' + currentSlide);
`;

content = content.replace(`                currentSlide = (currentSlide + 1) % allSlides.length;

                var newSlide = document.getElementById('slide-' + currentSlide);`, nextSlidePatch);

fs.writeFileSync('frontend/public/tv.html', content);
