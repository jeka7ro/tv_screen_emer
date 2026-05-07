const fs = require('fs');

let content = fs.readFileSync('frontend/public/tv.html', 'utf8');

// Update CSS
content = content.replace(
`        .slide.active {
            opacity: 1
        }`,
`        .slide.prev {
            opacity: 1;
            z-index: 10;
        }

        .slide.active {
            opacity: 1;
            z-index: 20;
        }`
);

// Update nextSlide() JS to use .prev
const targetJS = `                var oldSlideIndex = currentSlide;
                var oldSlide = document.getElementById('slide-' + oldSlideIndex);
                if (oldSlide) oldSlide.className = 'slide';`;

const replaceJS = `                var oldSlideIndex = currentSlide;
                var oldSlide = document.getElementById('slide-' + oldSlideIndex);
                if (oldSlide) oldSlide.className = 'slide prev'; // keep opacity 1, but lower z-index
                
                // Find any existing 'prev' slides and drop them to base 'slide' (opacity 0)
                var allDivs = document.querySelectorAll('.slide');
                for(var d=0; d<allDivs.length; d++) {
                    if (allDivs[d].id !== 'slide-' + oldSlideIndex && allDivs[d].className.indexOf('active') === -1) {
                        allDivs[d].className = 'slide';
                    }
                }`;

content = content.replace(targetJS, replaceJS);

fs.writeFileSync('frontend/public/tv.html', content);
