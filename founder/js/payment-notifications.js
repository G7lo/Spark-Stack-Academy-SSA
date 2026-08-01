import { createNotification } from "./notification-service.js";


export function notifyPaymentReceived(
    founderId,
    studentName,
    amount
){

createNotification({

userId: founderId,

title:
"Payment Received 💰",

message:
`${studentName} paid KES ${Number(amount).toLocaleString()}`,

type:
"payment",

priority:
"high",

link:
"payments.html"

});


}