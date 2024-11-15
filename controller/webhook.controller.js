const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CONSTANT = require("../common/constant");

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
            console.log("Get Webhook22222");
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
                    for (const status of value.statuses) {
                        await MESSAGE_LOG.updateOne(
                            { waMessageId: status.id },
                            {
                                status: status.status,
                                updatedAt: new Date()
                            }
                        ).then((data) => console.log(data));
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
            const newReceivedMessage = new RECEIVED_MESSAGE({
                from: msg.from,
                fromName: msg.fromName,
                message: msg.message
            });

            await newReceivedMessage.save();
            const responseMessage = "Hello! Thank you for reaching out. Call us at 9727427410 for more information!";
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