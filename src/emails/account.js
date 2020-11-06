const sgMail = require('@sendgrid/mail')

const SENDGRIDAPIKEY ='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'

sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'zkurdi45@gmail.com',
        subject: 'thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'zkurdi45@gmail.com',
        subject: 'thanks for joining in!',
        text: `Hi ${name}, thanks for cancelling your subscription with our horrible service fuck you and have a nice day`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}