import cron from "node-cron";
import { Inventory } from "../models/inventory.model.js";
import { sendEmail } from "../utils/sendEmail.js";

export const checkAndNotifyLowStock = async () => {
	try {
		// Find items where stock is less than or equal to threshold using MongoDB aggregation expressions
		const lowStockItems = await Inventory.find({
			$expr: { $lte: ["$stock", "$threshold"] },
		});

		if (lowStockItems.length === 0) {
			console.log("[stock-monitor] No low-stock items detected.");
			return { count: 0, items: [] };
		}

		const tableRows = lowStockItems
			.map(
				(item) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.category}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: red; font-weight: bold;">${item.stock}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.threshold}</td>
        </tr>
      `,
			)
			.join("");

		const htmlContent = `
    <h2>⚠️ Low Stock Inventory Alert</h2>
    <p>The following items have dropped below their configured safety thresholds and require restocking:</p>
    <table style="border-collapse: collapse; width: 100%; text-align: left;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border: 1px solid #ddd;">Item Name</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Category</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Current Stock</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Threshold</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

		const recipient =
			process.env.ADMIN_ALERT_EMAIL ||
			process.env.EMAIL_USER ||
			process.env.ADMIN_EMAIL;

		await sendEmail({
			to: recipient,
			subject: `[ALERT] Low Stock Notice: ${lowStockItems.length} item(s) low`,
			html: htmlContent,
		});

		console.log(
			`[stock-monitor] Low-stock alert sent for ${lowStockItems.length} items to ${recipient}.`,
		);

		return { count: lowStockItems.length, items: lowStockItems };
	} catch (error) {
		console.error(
			"[stock-monitor] Failed to execute low-stock monitoring job:",
			error.message,
		);
		throw error;
	}
};

export const initStockCronJob = () => {
	// Runs at minute 0 of every hour ('0 * * * *')
	cron.schedule("0 * * * *", async () => {
		try {
			await checkAndNotifyLowStock();
		} catch (error) {
			console.error("[node-cron] Scheduled task failed:", error.message);
		}
	});
	console.log("[node-cron] Stock monitoring cron job initialized ('0 * * * *').");
};
