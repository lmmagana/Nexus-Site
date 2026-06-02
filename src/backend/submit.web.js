import {myGetEvent, myGetMem, myGetPlan, myGetService, myGetTicket, myGetPlanPrice, myGetTicketPrice} from 'backend/helpers.js'
import { PLAN_LOOKUP } from 'backend/constants.js'
import { webMethod, Permissions } from "wix-web-module";
import wixData from "wix-data";

export const submission = webMethod(Permissions.Anyone, async (who, name_id, purchase_id, paymentMethod, amountPaid, class1_id, class2_id, class3_id, notes) => {
    try {
        let class1, class2, class3, event_id = "";
        if (class1_id) { class1 = await myGetService(class1_id); }
        if (class2_id) { class2 = await myGetService(class2_id); }
        if (class3_id) { class3 = await myGetService(class3_id); } //if (event_id) { event = await myGetEvent(event_id); }

        let name = "";
        if (name_id) {name = await myGetMem(name_id);}
        
        let purchase, payment = "";
        //const isNotPlanId = (value) => value.includes("N/A") || value.includes("Other") || value.includes("Booked Online") || value.includes("Physical") || value.includes("Drop") || value.includes("Day");
        const isNotPlanId = (value) => !value.includes("-");
        if(event_id){
            purchase = await myGetTicket(purchase_id);
            payment = paymentMethod;
        // } else if (purchase_id.includes("N/A")) {
        //     purchase = purchase_id;
        //     payment = isNotPlanId(paymentMethod) ? paymentMethod : await myGetPlan(paymentMethod);
        } else if (isNotPlanId(purchase_id)) {
            purchase = purchase_id;
            //payment = paymentMethod;
            payment = isNotPlanId(paymentMethod) ? paymentMethod : await myGetPlan(paymentMethod);
        } else {
            if (purchase_id) {purchase = await myGetPlan(purchase_id);}
            payment = paymentMethod;
        }

        let toInsert = {
            who: who,
            name: name,
            purchase: purchase,
            paymentMethod: payment,
            amountPaid: amountPaid,
            class1: class1,
            class2: class2,
            class3: class3,
            notes: notes
        }
        let options = {
            suppressAuth: true,
            suppressHooks: true,
        };

        wixData.insert("Check-In", toInsert, options);
        return "Submission successful!";
    } catch (error) {
        console.error("Dateset Update Error", error);
        return "Error";
    }
});