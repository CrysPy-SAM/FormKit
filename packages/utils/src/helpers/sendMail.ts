import { Resend } from "resend";
import { env } from "../env.js";

const resend = new Resend(env.RESEND_API_KEY);

type Attachment = {
    filename: string;
    content: Buffer | string;
    path?: string;
};

type SendMailProps = {
    from?: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    attachments?: Attachment[];
};

const DEFAULT_FROM_NAME = "FormKit";
const FROM_ADDRESS = env.MAIL_FROM_ADDRESS;

export async function sendMail({ from = DEFAULT_FROM_NAME, to, cc, bcc, subject, html, attachments }: SendMailProps): Promise<{ success: true; id: string }> {
    
    if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new Error("Recipient email is required");
    }

    const toList = Array.isArray(to) ? to : [to];
    const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    const { data, error } = await resend.emails.send({
        from: `${from} <${FROM_ADDRESS}>`,
        to: toList,
        cc: ccList,
        bcc: bccList,
        subject,
        html,
        attachments,
    });

    if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, id: data!.id };
}