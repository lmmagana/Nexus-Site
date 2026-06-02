import { queryMembersNames } from 'backend/listMembers.web';
import { checkActivePlan, addPlan, getPlansForDropdown, getSessionsRemaining, getPrivatesRemaining, paymentTypes } from 'backend/members.jsw';
import { getServicesForToday } from 'backend/services.jsw';
import { submission } from 'backend/submit.web'
import { addParticipant } from 'backend/booking.jsw'
import wixSiteFrontend from "wix-site-frontend";
import wixData from "wix-data";

let allMembers = [];

$w.onReady(async () => {
    // allMembers = await queryMembersNames();
    // $w('#contactDropdown').options = allMembers;
});

$w('#submit').onClick(async (event) => {
    const who = $w("#who").value;
    //const contact = $w("#contactDropdown").value;
    const amountPaid = $w("#amountPaid").value;
    const paymentMethod = $w("#paymentType").value;
    const additionalNotes = $w("#notes").value;
    

    //Build missing fields list
    let missingFields = [];
    if (!who) { missingFields.push("Who's Running Check-In?");
        $w("#who").updateValidityIndication(); }
    // if (!contact) { missingFields.push("Attendee's Name");
    //     $w("#contactDropdown").updateValidityIndication(); }
    if (!amountPaid) { missingFields.push("Amount Paid");
        $w("#amountPaid").updateValidityIndication(); }
    if (!paymentMethod) { missingFields.push("Payment Method");
        $w("#paymentType").updateValidityIndication(); }

    const skipNotesKeywords = additionalNotes.includes("Cash Count") || additionalNotes.includes("*****");

    if (missingFields.length > 0 && !skipNotesKeywords) {
        // Print error message stating missing fields
        $w("#text74").text = `Please fill in: ${missingFields.join(", ")}`;
        $w("#text74").show();
        return;
    } else {
        let toInsert = {
            who: who,
            // student: contact,
            paymentMethod: paymentMethod,
            price: amountPaid,
            additionalNotes: additionalNotes
        }
        let options = {
            suppressAuth: true,
            suppressHooks: true,
        };

        try{
            wixData.insert("KlaveCheck-In", toInsert, options);
        } catch(error){
            console.log("Error", error);
        }

        $w("#text74").text = `Success!`;
        $w("#text74").show();

        // $w("#contactDropdown").value = "";
        $w("#paymentType").value = "";
        $w("#amountPaid").value = "";
        $w("#notes").value = "";

        setTimeout(() => {
            $w('#klave-check-in-read').refresh()
        }, 500);
    }
});

// $w('#submit').onClick(async (event) => {
//     // Collect required values
//     const who = $w("#who").value;
//     const contact = $w("#contactDropdown").value;
//     const purchase = $w("#purchase").value;
//     const paymentMethod = $w("#paymentType").value;

//     // Optional values
//     const class1 = $w("#classDropdown1").value;
//     const class2 = $w("#classDropdown2").value;
//     const class3 = $w("#classDropdown3").value;
//     const notes = $w("#notes").value;

//     // Build missing fields list
//     let missingFields = [];
//     if (!who) missingFields.push("Who's Running Check-In");
//     if (!contact) missingFields.push("Contact");
//     if (!purchase) missingFields.push("Purchase");
//     if (!paymentMethod) missingFields.push("Payment Method");

//     if (missingFields.length > 0 && notes.trim().length === 0) {
//         // Print error message stating missing fields
//         $w("#confirmationText").text = `Please fill in: ${missingFields.join(", ")}`;
//         $w("#confirmationText").show();
//         return;
//     } else {
//         try { //Add Plan
//             if(activePlan === 0) addPlan(contact, purchase);
//         } catch(error){
//             console.log("Adding Plan Error",error);
//             $w("#confirmationText").text = error?.message || error?.toString() || String(error);
//             $w("#confirmationText").show();
//             return;
//         }

//         try { //Book Participant
//             let timezone = wixSiteFrontend.timezone;
//             if(class1) addParticipant(contact, class1, timezone);
//             if(class2) addParticipant(contact, class2, timezone);
//             if(class3) addParticipant(contact, class3, timezone);

//         } catch (error) {
//             console.log("Booking Error",error);
//             $w("#confirmationText").text = error?.message || error?.toString() || String(error);
//             $w("#confirmationText").show();
//             return;
//         }

//         try { //Update Backend CMS
//             const result = await submission(who, contact, purchase, paymentMethod, class1, class2, class3, notes);
//             $w("#confirmationText").text = result;
//             $w("#confirmationText").show();

//             // Clear the form fields
//             $w("#contactDropdown").value = "";
//             $w("#purchase").value = "";
//             $w("#paymentType").value = "";
//             $w("#classDropdown1").value = "";
//             $w("#classDropdown2").value = "";
//             $w("#classDropdown3").value = "";
//             $w("#notes").value = "";

//         } catch (error) {
//             $w("#confirmationText").text = error;
//             $w("#confirmationText").show();
//         }
//     }

    // Hide success message after 2 seconds
    setTimeout(() => {
        $w("#text74").hide();
        $w('#klave-check-in-read').refresh()
    }, 2000);
// });