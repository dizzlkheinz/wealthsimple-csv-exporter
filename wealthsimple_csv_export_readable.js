// biome-ignore lint/suspicious/noConfusingLabels: leading "javascript:" is the bookmarklet scheme prefix, not a JS label
javascript: (() => {
	/*
	 * Wealthsimple Transaction Export Bookmarklet
	 * Version: 0.3.0
	 * Features:
	 * - Exports to CSV (Date, Payee, Amount)
	 * - Formats Date as YYYY-MM-DD (compatible with YNAB/Excel)
	 * - Skips "Pending" transactions
	 * - Handles "Today"/"Yesterday" and "Month D, YYYY" dates
	 * - Locates the activity feed by structure (the element with the most
	 *   "$… CAD" rows) instead of by <h2> tags or styled-component class
	 *   names, so it survives Wealthsimple's frequent markup redesigns.
	 */

	function cleanAmount(str) {
		// Normalize various minus/dash characters, remove commas, strip non-numeric
		return parseFloat(
			str
				.replace(/[−–—―]/g, "-")
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

	// A date header is "Today", "Yesterday", or "Month D" / "Month D, YYYY".
	const DATE_RE = /^(Today|Yesterday|[A-Z][a-z]+ \d{1,2}(?:, \d{4})?)$/;
	// A transaction block always shows its amount as "$… CAD".
	const hasAmount = (t) => t.includes("CAD") && t.includes("$");

	// Find the feed without relying on tag names or CSS classes: it is the
	// element that has the most direct children which look like transaction
	// rows (each containing a "$… CAD" amount). Date headers sit between the
	// rows as siblings and carry no amount, so they don't affect the count.
	let feed = null;
	let bestCount = 0;
	for (const el of document.querySelectorAll("div")) {
		let count = 0;
		for (const child of el.children) {
			if (hasAmount(child.innerText || "")) count++;
		}
		if (count > bestCount) {
			bestCount = count;
			feed = el;
		}
	}

	if (!feed) {
		alert(
			"Could not find the activity feed.\n\n" +
				"Make sure you are on the Activity page at my.wealthsimple.com/activity " +
				"and have scrolled down to load some transactions.",
		);
		return;
	}

	const rows = [];
	const seen = new Set();
	let currentDate = null;

	for (const child of feed.children) {
		const text = (child.innerText || "").trim();
		if (!text) continue;

		// Date header: first line matches a date and the block has no amount.
		const firstLine = text.split("\n")[0].trim();
		if (DATE_RE.test(firstLine) && !hasAmount(text)) {
			currentDate = formatDate(firstLine);
			continue;
		}

		// Transaction row: needs a known date, an amount, and must not be Pending.
		if (!currentDate || !hasAmount(text) || /pending/i.test(text)) continue;

		// innerText layout: "Payee\n\nType\n\nAccount\n\nAmount CAD"
		const parts = text
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);
		const payee = parts[0];
		const amountPart = parts.find((p) => p.includes("CAD") && p.includes("$"));
		if (!payee || !amountPart) continue;

		const amount = cleanAmount(amountPart);
		if (Number.isNaN(amount)) continue;

		const uid = currentDate + payee + amount;
		if (!seen.has(uid)) {
			seen.add(uid);
			rows.push(
				[currentDate, `"${payee.replace(/"/g, '""')}"`, amount].join(","),
			);
		}
	}

	if (rows.length === 0) {
		const url = window.location.href;
		let msg = "No completed transactions found.\n\n";
		if (!url.includes("wealthsimple.com")) {
			msg +=
				"You don't appear to be on Wealthsimple.\nNavigate to my.wealthsimple.com/activity first.";
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
