import { queryMembers } from 'backend/listMembers.web';
import { checkActivePlan, addPlan, getPlansForDropdown, getSessionsRemaining, getPrivatesRemaining, paymentTypes } from 'backend/members.jsw';
import { getServicesForToday } from 'backend/services.jsw';
import { submission } from 'backend/submit.web'
import { queryEvents, queryTickets, bookEvent } from 'backend/events.web'
import { addParticipant } from 'backend/booking.jsw'
import wixSiteFrontend from "wix-site-frontend";

let allMembers = [];
let activePlan = 0;

const isWixPlanId = (value) => {
    return typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

$w.onReady(async () => {

    // populate Bookings dropdown
    $w('#classDropdown1').options = await getServicesForToday();
    $w('#classDropdown2').options = await getServicesForToday();
    $w('#classDropdown3').options = await queryEvents();

    // populate plans & paymentMethods dropdown
    $w('#purchase').options = await getPlansForDropdown();
    $w('#paymentType').options = await paymentTypes(0);

    // populate Contacts dropdown
    allMembers = await queryMembers();
    $w('#contactDropdown').options = allMembers;
});

$w('#contactDropdown').onChange(async (event) => {
    let memberId = $w('#contactDropdown').value;
    let eventId = $w('#classDropdown3').value;
    if (!memberId) return;

    try {
        const plans = await checkActivePlan(memberId);
        const sessions_remaining = await getSessionsRemaining(memberId);
        const privates_remaining = await getPrivatesRemaining(memberId);
        if (plans && !eventId) {
            const paymentTypeOptions = plans.map(opt => {
                let label = opt.label;
                if (sessions_remaining && /Punch/i.test(label)) {
                    label = `${label} - Remaining: ${sessions_remaining}`;
                } else if (privates_remaining && /Private/i.test(label)) {
                    label = `${label} - Remaining: ${privates_remaining}`;
                }
                return { label, value: opt.value };
            });

            //$w('#paymentType').options = paymentTypeOptions;
            //$w('#purchase').options = await paymentTypes(plans.planId);

            const regularPlans = await getPlansForDropdown();
            const purchaseTypes = await paymentTypes(plans.planId);
            $w('#purchase').options = purchaseTypes.concat(regularPlans);


            const regularPaymentTypes = await paymentTypes(0);
            const membershipPaymentTypes = paymentTypeOptions;
            $w('#paymentType').options = membershipPaymentTypes.concat(regularPaymentTypes);

            activePlan = 1;

        } else if (plans && eventId){
            $w('#purchase').options = await queryTickets(eventId);
            $w('#paymentType').options = await paymentTypes(0);
            activePlan = 1;
        } else if (!plans && eventId){
            $w('#purchase').options = await queryTickets(eventId);
            $w('#paymentType').options = await paymentTypes(0);
            activePlan = 0;
        } else {
            $w('#purchase').options = await getPlansForDropdown();
            $w('#paymentType').options = await paymentTypes(0);
            activePlan = 0;
        }
    } catch (error) {
        console.log("Failed to check for active plan");
    }
});

$w('#classDropdown3').onChange(async (event) => {
    const eventId = $w('#classDropdown3').value;
    if (!eventId) {
        $w('#purchase').options = await getPlansForDropdown();
        $w('#paymentType').options = await paymentTypes(0);
    } else {
        $w('#purchase').options = await queryTickets(eventId);
        $w('#paymentType').options = await paymentTypes(0);
    }
})

$w('#submit').onClick(async (event) => {
    // Collect required values
    const who = $w("#who").value;
    const contact = $w("#contactDropdown").value;
    const purchase = $w("#purchase").value;
    const paymentMethod = $w("#paymentType").value;
    const amountPaid = $w("#amountPaid").value;

    // Optional values
    const class1 = $w("#classDropdown1").value;
    const class2 = $w("#classDropdown2").value;
    const event = $w("#classDropdown3").value;
    const notes = $w("#notes").value;

    // Build missing fields list
    let missingFields = [];
    if (!who) missingFields.push("Who's Running Check-In");
    if (!contact) missingFields.push("Contact");
    if (!purchase) missingFields.push("Purchase");
    if (!paymentMethod) missingFields.push("Payment Method");
    if (!amountPaid) missingFields.push("Amount Paid");

    const skipNotesKeywords = notes.includes("Cash Count") || notes.includes("*****");

    if (missingFields.length > 0 && !skipNotesKeywords) {
        // Print error message stating missing fields
        $w("#confirmationText").text = `Please fill in: ${missingFields.join(", ")}`;
        $w("#confirmationText").show();
        return;

    } else if (!skipNotesKeywords) {
        try { //Add Plan
            if (isWixPlanId(purchase)) await addPlan(contact, purchase); // Adjust to be able to add 2 plans
        } catch (error) {
            console.log("Adding Plan Error", error);
            $w("#confirmationText").text = error?.message || error?.toString() || String(error);
            $w("#confirmationText").show();
            return;
        }

        try { //Book Participant
            let timezone = wixSiteFrontend.timezone;
            if (class1) await addParticipant(contact, class1, timezone);
            if (class2) await addParticipant(contact, class2, timezone);
            if (class3) await bookEvent(class3, contact, purchase);

        } catch (error) {
            console.log("Booking Error", error);
            $w("#confirmationText").text = error?.message || error?.toString() || String(error);
            $w("#confirmationText").show();
            return;
        }
    }

    try { //Update Backend CMS
        const result = await submission(who, contact, purchase, paymentMethod, amountPaid, class1, class2, class3, notes);
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
        $w("#amountPaid").value = "";

        //Update form fields
        $w('#purchase').options = await getPlansForDropdown();
        $w('#paymentType').options = await paymentTypes(0);

    } catch (error) {
        $w("#confirmationText").text = error;
        $w("#confirmationText").show();
    }

    // Hide success message after 2 seconds
    setTimeout(() => {
        $w("#confirmationText").hide();
        $w('#tableDataset').refresh()
    }, 1000);
});
