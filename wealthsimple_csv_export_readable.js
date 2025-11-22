javascript:(function(){
    /* 
     * Wealthsimple Transaction Export Bookmarklet
     * Features:
     * - Exports to CSV (Date, Payee, Amount)
     * - Formats Date as YYYY-MM-DD (compatible with YNAB/Excel)
     * - Skips "Pending" transactions
     * - Handles "Today"/"Yesterday" and standard dates
     * - clean parsing of currency (handles negative symbols like â−)
     */

    function cleanAmount(str) {
        // Remove currency symbols, spaces, and normalize negative signs
        return parseFloat(str.replace(/[â−â–â—−]/g, '-').replace(/[^\d.-]/g, ''));
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
            // If the date string doesn't have a year (e.g. "May 12"), assume current year
            if (!/\d{4}/.test(dateStr)) {
                date.setFullYear(today.getFullYear());
            }
        }
        
        // Return YYYY-MM-DD format
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    const rows = [];
    const seen = new Set(); // To prevent duplicates

    // Step 1: Find all Date Headers (H2 tags)
    const headers = document.querySelectorAll('h2');

    headers.forEach(header => {
        const dateStr = header.innerText.trim();
        
        // Skip headers that aren't dates (like "Activity")
        if (!/Today|Yesterday|\d/.test(dateStr)) return;

        const formattedDate = formatDate(dateStr);

        // Step 2: Look at all sibling elements until the next Header
        let sibling = header.nextElementSibling;
        while (sibling && sibling.tagName !== 'H2') {
            
            // Step 3: Find Amount fields within this section
            // We use the 'data-fs-privacy-rule="unmask"' attribute which WS uses for sensitive data
            const amounts = sibling.querySelectorAll('p[data-fs-privacy-rule="unmask"]');

            amounts.forEach(pAmount => {
                const text = pAmount.innerText;
                
                // Check if this paragraph actually looks like an amount
                if (text.includes('$') || text.includes('CAD')) {
                    
                    // Step 4: Find the container row
                    // Traverse up parent elements until we find a container that holds both Payee and Amount
                    let row = pAmount.parentElement;
                    let attempts = 0;
                    
                    while (row && row.parentElement !== sibling && attempts < 5) {
                        // A valid row usually has at least 2 unmasked fields (Payee and Amount)
                        if (row.querySelectorAll('p[data-fs-privacy-rule="unmask"]').length >= 2) {
                            break;
                        }
                        row = row.parentElement;
                        attempts++;
                    }

                    if (row) {
                        // Step 5: Check for "Pending" status and skip if found
                        if (row.innerText.includes("Pending")) {
                            return;
                        }

                        // Step 6: Extract Payee and Amount
                        const allUnmasked = row.querySelectorAll('p[data-fs-privacy-rule="unmask"]');
                        if (allUnmasked.length >= 2) {
                            // The first unmasked element is invariably the Payee
                            const payeeRaw = allUnmasked[0].innerText;
                            
                            // Escape quotes in payee name for valid CSV
                            const payeeEscaped = `"${payeeRaw.replace(/"/g, '""')}"`;
                            
                            const amountClean = cleanAmount(text);
                            
                            // Create a unique ID to avoid adding the same transaction twice
                            // (e.g. if the DOM structure causes us to find the same row multiple times)
                            const uniqueId = formattedDate + payeeRaw + amountClean;

                            if (!seen.has(uniqueId)) {
                                seen.add(uniqueId);
                                rows.push([formattedDate, payeeEscaped, amountClean].join(","));
                            }
                        }
                    }
                }
            });
            
            sibling = sibling.nextElementSibling;
        }
    });

    // Final Step: Export or Alert
    if (rows.length === 0) {
        alert("No completed transactions found.\n\nTip: Scroll down to load more transactions before clicking.");
    } else {
        const csvContent = "Date,Payee,Amount\n" + rows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = "wealthsimple_activity.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
})();
