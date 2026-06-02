// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

    import wixWindowFrontend from "wix-window-frontend";

    $w.onReady(function () {
        setTimeout(() => {
        wixWindowFrontend.openLightbox("Wedding Intro Lesson");
    }, 2000); // 2000 milliseconds = 2 seconds
    });