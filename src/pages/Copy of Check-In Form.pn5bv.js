import { queryMembers, queryMembers_Fast } from 'backend/listMembers.web';
import { checkActivePlan, addPlan, getPlansForDropdown, getSessionsRemaining, getPrivatesRemaining, paymentTypes } from 'backend/members.jsw';
import { getServicesForToday } from 'backend/services.jsw';
import { submission } from 'backend/submit.web'
import { addParticipant } from 'backend/booking.jsw'
import wixSiteFrontend from "wix-site-frontend";

let allMembers = [];
let activePlan = 0;

$w.onReady(async () => {

    // populate Bookings dropdown
    $w('#classDropdown1').options = await getServicesForToday();
    $w('#classDropdown2').options = await getServicesForToday();
    $w('#classDropdown3').options = await getServicesForToday();

    // populate plans & paymentMethods dropdown
    $w('#purchase').options = await getPlansForDropdown();
    $w('#paymentType').options = await paymentTypes(0);

    // populate Contacts dropdown
    // allMembers = await queryMembers();
    // $w('#contactDropdown').options = allMembers;
});

$w('#contactDropdownTextbox').onKeyPress(async (event) => {
    const searchTerm = $w('#contactDropdownTextbox').value;
    if (searchTerm.length < 1) {
        $w('#contactDropdown').options = [];
        console.log("<1");
        return;
    } else {
        const results = await queryMembers_Fast(searchTerm);
        $w('#contactDropdown').options = results;
        //$w('#contactDropdown').expand();
        $w('#contactDropdown').focus();
        console.log("Yes?");
    }
});

// $w('#contactDropdown').onChange(async (event) => {
//     const memberId = $w('#contactDropdown').value;
//     if (!memberId) return;

//     try {
//         const plans = await checkActivePlan(memberId);
//         const sessions_remaining = await getSessionsRemaining(memberId);
//         const privates_remaining = await getPrivatesRemaining(memberId);
//         if (plans) {
//             const paymentTypeOptions = plans.map(opt => {
//                 let label = opt.label;
//                 if (sessions_remaining && /Punch/i.test(label)) {
//                     label = `${label} - Sessions Remaining: ${sessions_remaining}`;
//                 } else if (privates_remaining && /Private/i.test(label)) {
//                     label = `${label} - Privates Remaining: ${privates_remaining}`;
//                 }
//                 return { label, value: opt.value };
//             });

//             $w('#paymentType').options = paymentTypeOptions;
//             $w('#purchase').options = await paymentTypes(plans.planId);
//             activePlan = 1;

//         } else {
//             $w('#purchase').options = await getPlansForDropdown();
//             $w('#paymentType').options = await paymentTypes(0);
//             activePlan = 0;
//         }
//     } catch (error) {
//         console.log("Failed to check for active plan");
//     }
// });

$w('#submit').onClick(async (event) => {
    // Collect required values
    const who = $w("#who").value;
    const contact = $w("#contactDropdown").value;
    const purchase = $w("#purchase").value;
    const paymentMethod = $w("#paymentType").value;

    // Optional values
    const class1 = $w("#classDropdown1").value;
    const class2 = $w("#classDropdown2").value;
    const class3 = $w("#classDropdown3").value;
    const notes = $w("#notes").value;

    // Build missing fields list
    let missingFields = [];
    if (!who) missingFields.push("Who's Running Check-In");
    if (!contact) missingFields.push("Contact");
    if (!purchase) missingFields.push("Purchase");
    if (!paymentMethod) missingFields.push("Payment Method");

    if (missingFields.length > 0 && notes.trim().length === 0) {
        // Print error message stating missing fields
        $w("#confirmationText").text = `Please fill in: ${missingFields.join(", ")}`;
        $w("#confirmationText").show();
        return;
    } else {
        try { //Add Plan
            if (activePlan === 0) addPlan(contact, purchase);
        } catch (error) {
            console.log("Adding Plan Error", error);
            $w("#confirmationText").text = error?.message || error?.toString() || String(error);
            $w("#confirmationText").show();
            return;
        }

        try { //Book Participant
            let timezone = wixSiteFrontend.timezone;
            if (class1) addParticipant(contact, class1, timezone);
            if (class2) addParticipant(contact, class2, timezone);
            if (class3) addParticipant(contact, class3, timezone);

        } catch (error) {
            console.log("Booking Error", error);
            $w("#confirmationText").text = error?.message || error?.toString() || String(error);
            $w("#confirmationText").show();
            return;
        }

        try { //Update Backend CMS
            const result = await submission(who, contact, purchase, paymentMethod, class1, class2, class3, notes);
            $w("#confirmationText").text = result;
            $w("#confirmationText").show();

            // Clear the form fields
            $w("#contactDropdown").value = "";
            $w("#purchase").value = "";
            $w("#paymentType").value = "";
            $w("#classDropdown1").value = "";
            $w("#classDropdown2").value = "";
            $w("#classDropdown3").value = "";
            $w("#notes").value = "";

        } catch (error) {
            $w("#confirmationText").text = error;
            $w("#confirmationText").show();
        }
    }

    // Hide success message after 2 seconds
    setTimeout(() => {
        $w("#confirmationText").hide();
        $w('#tableDataset').refresh()
    }, 2000);
});