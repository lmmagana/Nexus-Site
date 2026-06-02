import { queryMembers } from 'backend/listMembers.web';
import { checkActivePlan, addPlan, getPlansForDropdown, getSessionsRemaining, paymentTypes } from 'backend/members.jsw';
import { submission } from 'backend/submit.web'
import { addParticipant } from 'backend/booking.jsw'
import { queryEvents, addGuest } from 'backend/events.web'

let allMembers = [];
let activePlan = 0;

$w.onReady(async () => {
    // populate Contacts dropdown
    allMembers = await queryMembers();
    $w('#contactDropdown').options = allMembers;

    // populate Bookings dropdown
    $w('#classDropdown1').options = await queryEvents();

    // populate plans & paymentMethods dropdown
    $w('#purchase').options = await getPlansForDropdown();
    $w('#paymentType').options = await paymentTypes(0);
});

$w('#submit').onClick(async (event) => {
    // Collect required values
    const who = $w("#who").value;
    const contact = $w("#contactDropdown").value;
    const purchase = $w("#purchase").value;
    const paymentMethod = $w("#paymentType").value;

    // Optional values
    const class1 = $w("#classDropdown1").value;
    const notes = $w("#notes").value;

    // Build missing fields list
    let missingFields = [];
    if (!who) missingFields.push("Who's Running Check-In");
    if (!contact) missingFields.push("Contact");
    if (!purchase) missingFields.push("Purchase");
    if (!paymentMethod) missingFields.push("Payment Method");

    if (missingFields.length > 0) {
        // Print error message stating missing fields
        $w("#confirmationText").text = `Please fill in: ${missingFields.join(", ")}`;
        $w("#confirmationText").show();
        return;
    } else {

        try { //Update Backend CMS
            const result = await submission(who, contact, purchase, paymentMethod, class1, '', '', notes);
            $w("#confirmationText").text = result;
            $w("#confirmationText").show();

            // Clear the form fields
            $w("#contactDropdown").value = "";
            $w("#purchase").value = "";
            $w("#paymentType").value = "";
            $w("#classDropdown1").value = "";
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