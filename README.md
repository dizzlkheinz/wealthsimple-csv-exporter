# Wealthsimple CSV Exporter

![Version](https://img.shields.io/badge/version-0.2.3-green.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

A simple bookmarklet to export your Wealthsimple transaction history to CSV format, compatible with budgeting tools like YNAB, Excel, and Google Sheets. Works with any Wealthsimple account.

## Features

- **One-Click Export**: Export transactions directly from your Wealthsimple activity page
- **CSV Format**: Date, Payee, Amount columns in a clean CSV format
- **YNAB-Compatible**: Dates formatted as YYYY-MM-DD for easy import
- **Smart Date Handling**: Automatically converts "Today", "Yesterday", and relative dates
- **Skips Pending**: Only exports completed transactions
- **Clean Currency Parsing**: Handles various negative sign symbols (−, –, —)
- **No Duplicates**: Intelligent deduplication prevents duplicate entries
- **Privacy-Friendly**: Runs entirely in your browser—no data sent anywhere

## Installation

1. **Show your bookmarks bar** if it's hidden:
   - Chrome/Edge: Press `Ctrl+Shift+B` (Windows) or `Cmd+Shift+B` (Mac)
   - Firefox: Press `Ctrl+Shift+B` (Windows) or `Cmd+Shift+B` (Mac)
   - Safari: `View` → `Show Favorites Bar`

2. **Select the below link and drag in to your bookmarks bar:**


```
javascript:(function()%7B%0Afunction%20c(s)%7Breturn%20parseFloat(s.replace(%2F%5B%5Cu2212%5Cu2013%5Cu2014%5Cu2015%5D%2Fg%2C'-').replace(%2F%2C%2Fg%2C'').replace(%2F%5B%5E%5Cd.-%5D%2Fg%2C''))%3B%7D%0Afunction%20f(d)%7Bvar%20t%3Dnew%20Date()%2Cr%3Bif(d%3D%3D%3D'Today')r%3Dt%3Belse%20if(d%3D%3D%3D'Yesterday')%7Br%3Dnew%20Date(t)%3Br.setDate(t.getDate()-1)%3B%7Delse%7Br%3Dnew%20Date(d)%3Bif(!%2F%5Cd%7B4%7D%2F.test(d))r.setFullYear(t.getFullYear())%3B%7Dreturn%5Br.getFullYear()%2CString(r.getMonth()%2B1).padStart(2%2C'0')%2CString(r.getDate()).padStart(2%2C'0')%5D.join('-')%3B%7D%0Avar%20h2%3D%5B...document.querySelectorAll('h1,h2,h3,h4,h5,h6')%5D.find(h%3D%3E%2FToday%7CYesterday%7C%5Cd%2F.test(h.innerText))%3B%0Aif(!h2)%7Balert('Could%20not%20find%20activity%20feed.%5CnGo%20to%20my.wealthsimple.com%2Factivity%20first.')%3Breturn%3B%7D%0Avar%20con%3Dh2.parentElement.parentElement%2Crows%3D%5B%5D%2Cseen%3Dnew%20Set()%2Ccur%3Dnull%3B%0Afor(var%20ch%20of%20con.children)%7Bvar%20tx%3Dch.innerText%26%26ch.innerText.trim()%3Bif(!tx)continue%3Bvar%20hh%3Dch.querySelector('h1,h2,h3,h4,h5,h6')%2Cdt%3Dhh%3Fhh.innerText.trim()%3Atx%3Bif(%2F%5E(Today%7CYesterday)%24%2F.test(dt)%7C%7C%2F%5E%5Cw%2B%20%5Cd%7B1%2C2%7D%2C%20%5Cd%7B4%7D%24%2F.test(dt))%7Bcur%3Df(dt)%3Bcontinue%3B%7Dif(!cur%7C%7C!tx.includes('CAD')%7C%7Ctx.includes('Pending'))continue%3Bvar%20pts%3Dtx.split(/%5Cn+/).map(s%3D%3Es.trim()).filter(Boolean)%2Cpy%3Dpts%5B0%5D%2Cap%3Dpts.find(p%3D%3Ep.includes('CAD')%26%26p.includes('%24'))%3Bif(!py%7C%7C!ap)continue%3Bvar%20am%3Dc(ap)%3Bif(isNaN(am))continue%3Bvar%20uid%3Dcur%2Bpy%2Bam%3Bif(!seen.has(uid))%7Bseen.add(uid)%3Brows.push(%5Bcur%2C'%22'%2Bpy.replace(%2F%22%2Fg%2C'%22%22')%2B'%22'%2Cam%5D.join('%2C'))%3B%7D%7D%0Aif(!rows.length)%7Bvar%20u%3Dlocation.href%2Cdc%3D(document.body.innerText.match(%2F%5C%24%2Fg)%7C%7C%5B%5D).length%2Cmsg%3D'No%20completed%20transactions%20found.%5Cn%5Cn'%3Bif(!u.includes('wealthsimple.com'))msg%2B%3D'Not%20on%20Wealthsimple.%20Go%20to%20my.wealthsimple.com%2Factivity.'%3Belse%20if(!dc)msg%2B%3D'No%20dollar%20amounts%20found.%20Make%20sure%20you%20are%20on%20the%20Activity%20page.'%3Belse%20msg%2B%3D'Tip%3A%20Scroll%20down%20to%20load%20more%20transactions%20first.%5Cn%5CnIf%20still%20not%20working%2C%20report%20at%3A%5Cngithub.com%2Fdizzlkheinz%2Fwealthsimple-csv-exporter%2Fissues'%3Balert(msg)%3Breturn%3B%7D%0Avar%20csv%3D'Date%2CPayee%2CAmount%5Cn'%2Brows.join('%5Cn')%2Cbl%3Dnew%20Blob(%5Bcsv%5D%2C%7Btype%3A'text%2Fcsv%3Bcharset%3Dutf-8%3B'%7D)%2Cul%3DURL.createObjectURL(bl)%2Ca%3Ddocument.createElement('a')%3Ba.href%3Dul%3Ba.download%3D'wealthsimple_activity.csv'%3Bdocument.body.appendChild(a)%3Ba.click()%3Bdocument.body.removeChild(a)%3BURL.revokeObjectURL(ul)%3B%0A%7D)()
```
3. **Name it**: You might want to call it `WS Export CSV`

## Usage

1. Log in to [Wealthsimple](https://my.wealthsimple.com/)
2. Navigate to your Activity/Transactions page
3. Filter your accounts as needed using Wealthsimple's built-in filters
4. **Important**: Scroll down to load all the transactions you want to export (Wealthsimple loads them dynamically)
5. Click the bookmarklet in your bookmarks bar
6. A CSV file will automatically download

## CSV Output Format

The exported CSV contains three columns:

```csv
Date,Payee,Amount
2025-11-22,"Starbucks",-5.67
2025-11-21,"Direct Deposit - Employer",2500.00
2025-11-20,"Transfer to Savings",-500.00
```

- **Date**: YYYY-MM-DD format (sorts correctly in Excel/Sheets)
- **Payee**: Transaction description (quoted for CSV safety)
- **Amount**: Positive for income, negative for expenses

## Privacy & Security

- All code runs entirely in your browser
- No data is sent to any external server
- The bookmarklet only reads visible transaction data
- Source code is fully visible in `wealthsimple_csv_export_readable.js`

## Contributing

Found a bug or have a feature request? Open an issue or submit a pull request!

## License

MIT License - feel free to use, modify, and share!

## Disclaimer

This is an unofficial tool and is not affiliated with Wealthsimple. Use at your own risk. Always verify exported data for accuracy.
