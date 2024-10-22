const MESSAGE_SCHEDULE = require("../module/messageSchedule.module");
const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CLIENT_MODULE = require("../module/client.module");
const CONSTANT = require("../common/constant");
const commonService = require("../common/common");
const { validationResult } = require("express-validator");

/*
Method: POST
Todo: Webhook 
*/
exports.webhookPost = async (req, res) => {
    const errors = validationResult(req).array();
    if (errors && errors.length > 0) {
        let messArr = errors.map((a) => a.msg);
        return res.status(400).send({
            message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
            error: messArr.join(", "),
        });
    } else {
        try {
            const data = req.body;

            // Handle incoming messages
            await processWhatsappMessages(data);
            console.log("Process Whatsapp Message Done", JSON.stringify(data));

            // Update WhatsApp statuses
            console.log("JSON.stringify(data) : ",JSON.stringify(data));
            
            await updateWhatsappStatuses(JSON.stringify(data));

            res.status(200).send({ message: CONSTANT.MESSAGE.WEBHOOK_SUCCESS });
        } catch (err) {
            return res.status(500).send({
                message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
            });
        }
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

    const myToken = "";
    console.log("Data : ", mode, token, challenge);

    if (mode && token) {
        console.log("Get Webhook");
        if (mode === "subscribe" && token === myToken) {
            console.log("Get Webhook1");
            res.status(200).send(challenge);
        } else {
            console.log("Get Webhook22222");
            res.status(403).send(CONSTANT.MESSAGE.DATA_NOT_FOUND)
        }
    } else {
        res.status(500).send(CONSTANT.MESSAGE.NOT_FOUND)
    }
};

// Function to handle the received message and insert into MongoDB
async function processWhatsappMessages(data) {
    try {
        const receivedMessages = await getAllWhatsappMessages(data);

        for (const msg of receivedMessages) {
            const newReceivedMessage = new RECEIVED_MESSAGE({
                from: msg.from,
                fromName: msg.fromName,
                message: msg.message
            });

            await newReceivedMessage.save();

            // Send response message
            const responseMessage = "Hello! Thank you for reaching out. Call us at 9727427410 for more information!";
            await sendWhatsappTextMessage(msg.from, responseMessage);
        }
    } catch (error) {
        console.error('Error processing WhatsApp messages:', error);
        throw error;
    }
}

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
                messaging_product: 'whatsapp',
                to: `+${to}`,
                type: 'text',
                text: { body: message }
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
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
                    console.log("value.statuses : ", value.statuses);
                    for (const status of value.statuses) {
                        console.log("Status : ", status);

                        await MESSAGE_LOG.updateOne(
                            { waMessageId: status.id },
                            {
                                status: status,
                                updatedAt: new Date()
                            }
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating WhatsApp statuses:', error);
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