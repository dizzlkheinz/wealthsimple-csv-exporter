javascript: (() => {
	/*
	 * Wealthsimple Transaction Export Bookmarklet
	 * Version: 0.2.3
	 * Features:
	 * - Exports to CSV (Date, Payee, Amount)
	 * - Formats Date as YYYY-MM-DD (compatible with YNAB/Excel)
	 * - Skips "Pending" transactions
	 * - Handles "Today"/"Yesterday" and standard dates
	 * - Parses transaction rows directly from innerText (robust to DOM changes)
	 * - Allows legitimate duplicate transactions (same date/payee/amount on different days)
	 * - Deduplicates by element ID to prevent re-processing
	 */

	function cleanAmount(str) {
		// Normalize various minus/dash characters, remove commas, strip non-numeric
		return parseFloat(
			str
				.replace(/[−\u2212\u2013\u2014]/g, "-")
				.replace(/,/g, "")
				.replace(/[^\d.-]/g, ""),
		);
	}

	function formatDate(dateStr) {
		const today = new Date();
		let date;
		if (dateStr === "Today") {
			date = today;
		} else if (dateStr === "Yesterday") {
			date = new Date(today);
			date.setDate(today.getDate() - 1);
		} else {
			date = new Date(dateStr);
			if (!/\d{4}/.test(dateStr)) date.setFullYear(today.getFullYear());
		}
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	// Find the main feed container: grandparent of the first date header.
	// "Today" lives in an h3 inside a header div; all other dates are plain sibling divs.
	const firstHeading = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) =>
		/Today|Yesterday|\d/.test(h.innerText),
	);
	if (!firstHeading) {
		alert(
			"Could not find activity feed.\nMake sure you are on the Activity page at my.wealthsimple.com/activity",
		);
		return;
	}
	const container = firstHeading.parentElement.parentElement;

	const rows = [];
	const seen = new Set();
	let currentDate = null;

	for (const child of container.children) {
		const text = child.innerText && child.innerText.trim();
		if (!text) continue;

		// Date header: "Today" has a heading inside its container div; other dates are plain divs
		const h2 = child.querySelector("h1, h2, h3, h4, h5, h6");
		const dateText = h2 ? h2.innerText.trim() : text;
		if (
			/^(Today|Yesterday)$/.test(dateText) ||
			/^\w+ \d{1,2}, \d{4}$/.test(dateText)
		) {
			currentDate = formatDate(dateText);
			continue;
		}

		// Transaction row: must have a current date, contain CAD, and not be Pending
		if (!currentDate || !text.includes("CAD") || text.includes("Pending"))
			continue;

		// Transaction innerText format: "Payee[newline(s)]Type[newline(s)]Account[newline(s)]Amount CAD..."
		// Parser handles single or multiple consecutive newlines via /\n+/ regex
		const parts = text
			.split(/\n+/)
			.map((s) => s.trim())
			.filter(Boolean);
		const payee = parts[0];
		const amountPart = parts.find((p) => p.includes("CAD") && p.includes("$"));
		if (!payee || !amountPart) continue;

		const amount = cleanAmount(amountPart);
		if (Number.isNaN(amount)) continue;

		// Include button element ID to uniquely identify each transaction and allow
		// legitimate duplicate transactions (same date/payee/amount) to both be exported
		const button = child.querySelector('button[id]');
		const buttonId = button?.id || '';
		const uid = currentDate + payee + amount + buttonId;
		if (!seen.has(uid)) {
			seen.add(uid);
			rows.push(
				[currentDate, `"${payee.replace(/"/g, '""')}"`, amount].join(","),
			);
		}
	}

	if (rows.length === 0) {
		const url = window.location.href;
		const dollarCount = (document.body.innerText.match(/\$/g) || []).length;
		let msg = "No completed transactions found.\n\n";
		if (!url.includes("wealthsimple.com")) {
			msg +=
				"You don't appear to be on Wealthsimple.\nNavigate to my.wealthsimple.com/activity first.";
		} else if (dollarCount === 0) {
			msg +=
				"No dollar amounts found on page.\nMake sure you're on the Activity page.";
		} else {
			msg +=
				"Tip: Scroll down to load more transactions before clicking.\n\n" +
				"If transactions are visible but not exporting, please report at:\n" +
				"github.com/dizzlkheinz/wealthsimple-csv-exporter/issues";
		}
		alert(msg);
		return;
	}

	const csvContent = `Date,Payee,Amount\n${rows.join("\n")}`;
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "wealthsimple_activity.csv";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
})();
