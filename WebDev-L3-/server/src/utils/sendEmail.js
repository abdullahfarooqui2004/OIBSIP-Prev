import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async ({ to, subject, html }) => {
	const emailUser = process.env.EMAIL_USER;
	const emailPass = process.env.EMAIL_PASS;

	if (!emailUser || !emailPass) {
		throw new Error(
			`Email credentials missing. EMAIL_USER is ${emailUser ? "set" : "missing"}, EMAIL_PASS is ${emailPass ? "set" : "missing"}. Check your .env file.`,
		);
	}

	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE || "gmail",
		auth: {
			user: emailUser,
			pass: emailPass,
		},
	});

	const mailOptions = {
		from: `"Pizza Co." <${emailUser}>`,
		to,
		subject,
		html,
	};

	return transporter.sendMail(mailOptions);
};
