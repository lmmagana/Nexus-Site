    import wixWindowFrontend from "wix-window-frontend";

    $w.onReady(function () {
        setTimeout(() => {
        wixWindowFrontend.openLightbox("Intro Lesson");
    }, 2000); // 2000 milliseconds = 2 seconds
    });