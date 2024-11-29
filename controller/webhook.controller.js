const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CONSTANT = require("../common/constant");
const fs = require('fs');
const path = require('path');

/*
Method: POST
Todo: Webhook 
*/
exports.webhookPost = async (req, res) => {
    try {
        const body_params = req.body;
        if (body_params.entry[0]?.changes[0]?.value?.messages) {
            await processWhatsappMessages(body_params);
        } else {
            await updateWhatsappStatuses(JSON.stringify(body_params));
        }
        res.status(200).send({ message: CONSTANT.MESSAGE.WEBHOOK_SUCCESS });
    } catch (err) {
        return res.status(500).send({
            message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
        });
    }
};

/*
Method: GET
Todo: Webhook 
*/
exports.webhookGet = async (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    const myToken = "dsaadmin001";
    if (mode && token) {
        if (mode === "subscribe" && token === myToken) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send(CONSTANT.MESSAGE.DATA_NOT_FOUND)
        }
    } else {
        res.status(500).send(CONSTANT.MESSAGE.NOT_FOUND)
    }
};

// Simulating the WhatsApp API call for sending a text message
async function sendWhatsappTextMessage(to, message) {
    try {
        await fetch(process.env.WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: `+${to}`,
                type: "template",
                template: {
                    name: CONSTANT.TEMPLATE_NAME.FOR_ONLY_TEXT,
                    language: { code: "en" },
                    components: [
                        {
                            type: "body",
                            parameters: [{ type: "text", text: message ? message : "Hello! Thanks for reaching out to us." }],
                        },
                    ],
                },
            })
        }).then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const obj = {
                mobileNumber: data.contacts[0].input,
                waMessageId: data.messages[0].id,
                status: data.messages[0].message_status,
                messageTitle: message
            };
            await MESSAGE_LOG.create(obj);
        }).catch(err => {
            console.error(CONSTANT.MESSAGE.MESSAGE_NOT_SEND);
            throw err;
        });
    } catch (error) {
        console.error(error, CONSTANT.MESSAGE.ERROR_OCCURRED);
    }
}

// Functions for Processing Whatsapp Messages 
async function updateWhatsappStatuses(data) {
    try {
        const parsedData = JSON.parse(data);
        for (const entry of parsedData.entry) {
            for (const change of entry.changes) {
                const value = change.value;
                if (value.statuses) {
                    for (const status of value.statuses) {
                        const reason = status.errors?.[0]?.error_data?.details || status.errors?.[0]?.message || "Unknown error";
                        await MESSAGE_LOG.findOneAndUpdate(
                            { waMessageId: status.id },
                            {
                                status: status.status,
                                reason: reason,
                                updatedAt: new Date()
                            },
                            { returnDocument: "after" }
                        ).then(async (updatedData) => {
                            if (updatedData && (status.status === "read" || status.status === "accepted")) {
                                await CAMPAIGN_MODULE.findOneAndUpdate(
                                    { _id: updatedData.camId },
                                    {
                                        $inc: { receiver: 1 },
                                        updatedAt: new Date()
                                    },
                                    { returnDocument: "after" }
                                );
                            }
                            if (updatedData && (status.status === "read" || status.status === "failed" || status.status === "accepted")) {
                                const { camId, mobileNumber } = updatedData;
                                const sanitizedNumber = mobileNumber.replace('+', '');
                                const tempImagePath = path.resolve(
                                    __dirname,
                                    CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY_EDITED,
                                    `${camId}_${sanitizedNumber}.jpeg`
                                );
                                fs.unlink(tempImagePath, (err) => {
                                    if (err) {
                                        console.error(`Failed to delete image: ${tempImagePath}`, err);
                                    } else {
                                        console.log(`Successfully deleted image: ${tempImagePath}`);
                                    }
                                });
                            }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating WhatsApp statuses:', error);
        throw error;
    }
}

// Function to handle the received message and insert into MongoDB
async function processWhatsappMessages(data) {
    try {
        const receivedMessages = await getAllWhatsappMessages(data);
        for (const msg of receivedMessages) {
            const generateTicketNumber = () => {
                return Math.floor(Math.random() * 9000000000) + 1000000000;
            };
            let newReceivedMessage;
            const existingTicket = await RECEIVED_MESSAGE.findOne({ from: msg.from });
            if (existingTicket && existingTicket.ticketNumber) {
                newReceivedMessage = new RECEIVED_MESSAGE({
                    from: msg.from,
                    fromName: msg.fromName,
                    message: msg.message,
                    ticketNumber: existingTicket.ticketNumber,
                });
            } else {
                newReceivedMessage = new RECEIVED_MESSAGE({
                    from: msg.from,
                    fromName: msg.fromName,
                    message: msg.message,
                    ticketNumber: generateTicketNumber(),
                });
            }
            await newReceivedMessage.save();
            const responseMessage = "Hello! Thank you for reaching out. Call us at 8758997422 for more information!";
            await sendWhatsappTextMessage(msg.from, responseMessage);
        }
    } catch (error) {
        console.error('Error processing WhatsApp messages:', error);
        throw error;
    }
}

// Function to extract received messages
async function getAllWhatsappMessages(data) {
    const receivedMessages = [];
    if (data.entry && Array.isArray(data.entry)) {
        for (const entry of data.entry) {
            if (entry.changes && Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    const value = change.value;
                    if (value.messages && Array.isArray(value.messages)) {
                        let index = 0;
                        for (const message of value.messages) {
                            const profile = value.contacts[index++];
                            const messageObject = {
                                from: message.from || '',
                                fromName: profile?.profile?.name || '',
                                message: message.type === 'text' ? message.text.body : ''
                            };

                            receivedMessages.push(messageObject);
                        }
                    }
                }
            }
        }
    }

    return receivedMessages;
}