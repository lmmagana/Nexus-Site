// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixWindowFrontend from "wix-window-frontend";

$w.onReady(function () {

    // Write your Javascript code here using the Velo framework API

    // Print hello world:
    // console.log("Hello world!");

    // Call functions on page elements, e.g.:
    // $w("#button1").label = "Click me!";

    // Click "Run", or Preview your site, to execute your code

    $w("#form3").onSubmitSuccess(async () => {
        wixWindowFrontend.openLightbox("Thank You! 2");
    });

});