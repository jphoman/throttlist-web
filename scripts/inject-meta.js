const fs = require('fs')
const path = require('path')

const htmlPath = path.join(__dirname, '../dist/index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

const meta = `
    <meta name="description" content="Show off your build. Connect with the car community." />
    <meta property="og:title" content="Throttlist - Show off your Build!" />
    <meta property="og:description" content="Show off your build. Connect with the car community." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://throttlist.com" />
    <meta property="og:image" content="https://throttlist.com/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Throttlist - Show off your Build!" />
    <meta name="twitter:description" content="Show off your build. Connect with the car community." />
    <meta name="twitter:image" content="https://throttlist.com/og-image.png" />`

// Replace title and inject OG tags before </head>
html = html.replace(/<title>[^<]*<\/title>/, '<title>Throttlist - Show off your Build!</title>')
html = html.replace('</head>', `${meta}\n  </head>`)

fs.writeFileSync(htmlPath, html)
console.log('✓ Meta tags injected into dist/index.html')
