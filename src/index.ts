import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

admin.initializeApp();

const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;
const notifyToEmail = process.env.NOTIFY_TO_EMAIL;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});


export const notifyAssistanceChange = onDocumentWritten(
  {
    document: "asistencias/{familyId}",
    region: "europe-west1"
  },
  async (event) => {
    const beforeData = event.data?.before?.data() || null;
    const afterData = event.data?.after?.data() || null;

    if (!afterData) return; 

    const familyName = afterData.name;

    const beforeConfirm = beforeData?.assistance?.confirm;
    const afterConfirm = afterData?.assistance?.confirm;

    if (beforeConfirm === afterConfirm) return;

    const estado = afterConfirm ? "ha CONFIRMADO su asistencia": "ha cambiado su respuesta";

    const transporte = afterData.assistance?.transporte ?? "No indicado";
    const intolerancia = afterData.assistance?.intolerancia
      ? `Sí: ${afterData.assistance.detalleIntolerancia || "sin detalles"}`: "No";
    const mensaje = afterData.assistance?.mensaje || "(sin mensaje)";

    const mailOptions = {
      from: `"Boda - Confirmaciones" <${gmailEmail}>`,
      to: notifyToEmail,
      subject: `Nueva confirmación: ${familyName}`,
      text: `
            La familia: ${familyName} ${estado}

            Detalles:
            - Transporte: ${transporte}
            - Intolerancia: ${intolerancia}
            - Mensaje: ${mensaje}
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error enviando email:", error);
    }
  }
);