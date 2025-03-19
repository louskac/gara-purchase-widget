import { contactUs } from "./email-templates/contact-us"

const mailOptions = {
  fromName: "Coingarage",
  from: "noreply@coingarage.io",
}

export async function sendMail({
  recipients,
  subject,
  content,
  htmlContent,
}: {
  recipients: string[]
  subject: string
  content: string
  htmlContent?: string // Add this line with the optional ? marker
}): Promise<{ status: "ok" | "error"; error: any }> {
  try {
    const response = await fetch(`https://api.brevo.com/v3/smtp/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": `${process.env.BREVO_API_KEY}`,
      },
      body: JSON.stringify({
        sender: {
          name: mailOptions.fromName,
          email: mailOptions.from,
        },
        to: recipients.map((item) => {
          return { email: item }
        }),
        bcc: [{ email: "d.forejtek@gmail.com" }],
        subject,
        htmlContent: htmlContent ? htmlContent : contactUs({ content, subject }),
      }),
    })
    const data = await response.json()
    if (data.messageId) return data
    return { status: "error", error: data }
  } catch (error) {
    console.error(error)
    return { status: "error", error }
  }
}
